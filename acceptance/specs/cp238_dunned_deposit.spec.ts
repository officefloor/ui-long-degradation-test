import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';
import { auditLines } from '../support/audit';

// While a client has an invoice still overdue after its second reminder went out, a draft of theirs
// can only be sent once the deposits held for it are worth at least 30% of its grand total (after
// any conversion fee or card surcharge), as for a high-risk client, even when it has been approved.
test.describe('a deposit from a client behind on reminders', () => {
  test('a client with an unpaid second reminder must pay 30% up front', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-06-10',
      settings: { taxRate: 10 },
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      invoices: [
        { id: 1, clientId: 1, status: 'SENT', issueDate: '2026-04-10', dueDate: '2026-05-10',
          reminders: ['2026-05-20', '2026-06-03'],
          lineItems: [{ id: 1, description: 'Hosting', qty: 1, unitPrice: 100 }] },
        { id: 2, clientId: 1, status: 'DRAFT', issueDate: '2026-06-08', dueDate: '2026-06-30',
          lineItems: [{ id: 2, description: 'Build', qty: 1, unitPrice: 1000 }] },
      ],
    });
    await page.goto('/');

    await page.getByTestId('client-row-1').click();
    await page.getByTestId('invoice-row-2').click();
    await expect(page.getByTestId('invoice-approval')).toHaveText('Needs approval');
    await page.getByTestId('invoice-approve').click();
    await expect.poll(() => auditLines().some((l) => l.startsWith('INVOICE_APPROVED id=2 '))).toBe(true);
    // approved, but 30% of 1,100.00 must be held for it first
    await page.getByTestId('invoice-send').click();
    await expect(page.getByTestId('invoice-send-error')).toBeVisible();
    await page.getByTestId('payment-form-deposit').check();
    await page.getByTestId('payment-form-amount').fill('330');
    await page.getByTestId('payment-form-date').fill('2026-06-10');
    await page.getByTestId('payment-form-reference').fill('INV-0000026');
    await page.getByTestId('payment-form-submit').click();
    await expect.poll(() => auditLines()).toContain('DEPOSIT_RECORDED id=1 client=1 amount=330.00');
    await page.getByTestId('invoice-send').click();
    await expect(page.getByTestId('invoice-panel-status')).toHaveText('Part paid');
    await expect.poll(() => auditLines()).toContain('PAYMENT_RECORDED id=1 invoice=2 amount=330.00');
    await expect(page.getByTestId('invoice-amount-due')).toHaveText('$770.00');
  });
});
