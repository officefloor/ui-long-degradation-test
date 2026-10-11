import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';
import { auditLines } from '../support/audit';

// A sent invoice whose only payments are credit used on it when it was sent (allocations with their
// own applied date) can be voided: the credit goes back to the client's account, unused again,
// writing CREDIT_RETURNED payment=<payment id> amount=<amount> for each payment as well as
// INVOICE_VOIDED. An invoice with a payment recorded against it still can't be voided.
test.describe('voiding returns used credit', () => {
  test('voiding an invoice paid by credit puts the credit back', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-03-10',
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      invoices: [
        { id: 1, clientId: 1, status: 'SENT', issueDate: '2026-03-01', dueDate: '2026-04-30',
          lineItems: [{ id: 1, description: 'Design', qty: 1, unitPrice: 80 }] },
        { id: 2, clientId: 1, status: 'SENT', issueDate: '2026-03-01', dueDate: '2026-04-30',
          lineItems: [{ id: 2, description: 'Hosting', qty: 1, unitPrice: 50 }] },
      ],
      payments: [
        { id: 1, clientId: 1, amount: 100, date: '2026-02-20',
          allocations: [{ invoiceId: 1, amount: 80, date: '2026-03-01' }] },
        { id: 2, clientId: 1, amount: 30, date: '2026-03-05', allocations: [{ invoiceId: 2, amount: 30 }] },
      ],
    });
    await page.goto('/');

    await expect(page.getByTestId('client-row-1').getByTestId('client-credit')).toHaveText('$20.00'); // 100.00 - 80.00
    await page.getByTestId('client-row-1').click();
    // invoice 1 was paid only by credit used when it was sent
    await page.getByTestId('invoice-row-1').click();
    await page.getByTestId('invoice-void').click();
    await expect(page.getByTestId('invoice-panel-status')).toHaveText('Void');
    await expect.poll(() => auditLines()).toContain('CREDIT_RETURNED payment=1 amount=80.00');
    await expect.poll(() => auditLines()).toContain('INVOICE_VOIDED id=1 number=INV-0000018');
    await expect(page.getByTestId('client-row-1').getByTestId('client-credit')).toHaveText('$100.00');
    // 20.00 still due on invoice 2, less 100.00 of credit
    await expect(page.getByTestId('client-row-1').getByTestId('client-balance')).toHaveText('-$80.00');
    // invoice 2 has a payment recorded against it: it still can't be voided
    await page.getByTestId('invoice-row-2').click();
    await page.getByTestId('invoice-void').click();
    await expect(page.getByTestId('invoice-void-error')).toBeVisible();
    await expect(page.getByTestId('invoice-panel-status')).toHaveText('Part paid');
  });
});
