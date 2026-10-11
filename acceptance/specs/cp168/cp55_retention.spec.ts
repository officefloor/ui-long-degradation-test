import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';
import { auditLines } from '../support/audit';

// UPDATED for cp168 (mutates: [55, 56, 57, 60, 62, 63, 75, 83, 86, 93, 98, 106, 122, 139]):
// retention is gone; its three tests are replaced by one checking that an invoice has no retention
// box or figures and owes, and is paid, in full.
// Invoices hold nothing back: there is no retention form, retention figure or Release retention
// button, and an invoice owes, and is overdue on, its whole amount.
test.describe('retention', () => {
  test('an invoice holds nothing back', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-03-10',
      settings: { taxRate: 10 },
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      invoices: [
        { id: 1, clientId: 1, status: 'DRAFT', issueDate: '2026-03-01', dueDate: '2026-04-30',
          lineItems: [{ id: 1, description: 'Build', qty: 1, unitPrice: 333.33 }] },
        { id: 2, clientId: 1, status: 'SENT', issueDate: '2026-02-01', dueDate: '2026-02-28',
          lineItems: [{ id: 2, description: 'Design', qty: 1, unitPrice: 200 }] },
      ],
      payments: [
        { id: 1, clientId: 1, amount: 150, date: '2026-02-10', allocations: [{ invoiceId: 2, amount: 150 }] },
      ],
    });
    await page.goto('/');

    await page.getByTestId('client-row-1').click();
    await page.getByTestId('invoice-row-1').click();
    await expect(page.getByTestId('retention-form-pct')).toHaveCount(0);
    await expect(page.getByTestId('retention-form-submit')).toHaveCount(0);
    await expect(page.getByTestId('invoice-retention')).toHaveCount(0);
    await page.getByTestId('invoice-send').click();
    // 333.33 + 33.33 tax: all of it is due
    await expect(page.getByTestId('invoice-amount-due')).toHaveText('$366.66');
    await expect(page.getByTestId('invoice-release-retention')).toHaveCount(0);
    await page.getByTestId('payment-form-amount').fill('366.66');
    await page.getByTestId('payment-form-date').fill('2026-03-10');
    await page.getByTestId('payment-form-submit').click();
    await expect(page.getByTestId('invoice-panel-status')).toHaveText('Paid');
    // the part-paid invoice past its due date owes its last 70.00 and is overdue
    await page.getByTestId('invoice-row-2').click();
    await expect(page.getByTestId('invoice-amount-due')).toHaveText('$70.00');
    await expect(page.getByTestId('invoice-panel-status')).toHaveText('Overdue');
    await expect(page.getByTestId('client-row-1').getByTestId('client-overdue')).toHaveText('$70.00');
  });
});
