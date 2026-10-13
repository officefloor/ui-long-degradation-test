import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';
import { auditLines } from '../support/audit';

// Invoices no longer hold back retention: there is no retention box on the client form or the
// invoice, no retention figures or release button on the panel, and no Retention held status. An
// invoice owes its whole amount from the day it is sent, its payments, credit and credit notes
// apply to all of it (a credit note's excess goes straight to credit), it can have an instalment
// plan or an early-payment discount, and its late interest and overdue amount are worked out on all
// of it.
test.describe('no more retention', () => {
  test('invoices no longer hold anything back', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-03-10',
      settings: { taxRate: 10 },
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      invoices: [
        { id: 1, clientId: 1, status: 'DRAFT', issueDate: '2026-03-01', dueDate: '2026-04-30',
          lineItems: [{ id: 1, description: 'Build', qty: 1, unitPrice: 1000 }] },
        { id: 2, clientId: 1, status: 'SENT', issueDate: '2026-02-01', dueDate: '2026-04-30',
          lineItems: [{ id: 2, description: 'Design', qty: 1, unitPrice: 500 }] },
        { id: 3, clientId: 1, status: 'DRAFT', issueDate: '2026-03-05', dueDate: '2026-04-30', creditOf: 2,
          lineItems: [{ id: 3, description: 'Design', qty: 1, unitPrice: 200, creditOfLine: 2 }] },
      ],
      payments: [
        { id: 1, clientId: 1, amount: 450, date: '2026-02-20', allocations: [{ invoiceId: 2, amount: 450 }] },
      ],
    });
    await page.goto('/');

    await page.getByTestId('client-row-1').click();
    // no retention box on the client form, the invoice or anywhere else
    await expect(page.getByTestId('client-form-retention-pct')).toHaveCount(0);
    await page.getByTestId('invoice-row-1').click();
    await expect(page.getByTestId('retention-form-pct')).toHaveCount(0);
    await expect(page.getByTestId('invoice-retention')).toHaveCount(0);
    await page.getByTestId('invoice-send').click();
    await expect(page.getByTestId('invoice-panel-status')).not.toHaveText('Draft');
    // the whole 1,100.00 is due
    await expect(page.getByTestId('invoice-amount-due')).toHaveText('$1,100.00');
    await expect(page.getByTestId('invoice-release-retention')).toHaveCount(0);
    await expect(page.getByTestId('client-row-1').getByTestId('client-balance')).toHaveText('$1,200.00');
    // a 220.00 credit note against an invoice that owes 100.00 leaves 120.00 as credit straight away
    await page.getByTestId('invoice-row-3').click();
    await expect(page.getByTestId('invoice-panel-number')).toHaveText(await page.getByTestId('invoice-row-3').getByTestId('invoice-number').innerText());
    await page.getByTestId('invoice-send').click();
    await expect(page.getByTestId('invoice-panel-status')).not.toHaveText('Draft');
    await expect.poll(() => auditLines()).toContain('CREDIT_HELD payment=2 amount=120.00');
    await expect(page.getByTestId('invoice-row-2').getByTestId('invoice-status')).toHaveText('Paid');
    await expect(page.getByTestId('client-row-1').getByTestId('client-credit')).toHaveText('$120.00');
  });
});
