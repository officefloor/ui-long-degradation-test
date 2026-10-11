import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';
import { auditLines } from '../support/audit';

// A promise to pay on an invoice also holds off its overdue debit adjustment notes (they are
// Promised too), and payments on those notes since the promise count towards the promised amount.
test.describe("a promise covers the invoice's notes", () => {
  test("a promise holds off the invoice's notes too, and payments on them count towards it", { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-06-10',
      settings: { taxRate: 10, lateInterestRate: 12 },
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      invoices: [
        { id: 1, clientId: 1, status: 'SENT', issueDate: '2026-04-01', dueDate: '2026-04-30',
          promiseAmount: 400, promiseDate: '2026-06-25', promisedOn: '2026-06-01',
          lineItems: [{ id: 1, description: 'Build', qty: 1, unitPrice: 1000 }] },
        { id: 2, clientId: 1, status: 'SENT', issueDate: '2026-05-01', dueDate: '2026-05-15', adjustmentOf: 1,
          lineItems: [{ id: 2, description: 'Extra', qty: 1, unitPrice: 200 }] },
      ],
      payments: [
        { id: 1, clientId: 1, amount: 180, date: '2026-06-03', allocations: [{ invoiceId: 1, amount: 180 }] },
      ],
    });
    await page.goto('/');

    await page.getByTestId('client-row-1').click();
    // the note is held off with its invoice's promise
    await page.getByTestId('invoice-row-2').click();
    await expect(page.getByTestId('invoice-panel-status')).toHaveText('Promised');
    await expect(page.getByTestId('client-row-1').getByTestId('client-overdue')).toHaveText('$0.00');
    await page.getByTestId('payment-form-amount').fill('220');
    await page.getByTestId('payment-form-date').fill('2026-06-10');
    await page.getByTestId('payment-form-submit').click();
    // 180.00 on the invoice and 220.00 on its note make the 400.00 promised: kept
    await expect(page.getByTestId('invoice-panel-status')).toHaveText('Overdue');
    await page.getByTestId('invoice-row-1').click();
    await expect(page.getByTestId('invoice-panel-number')).toHaveText(await page.getByTestId('invoice-row-1').getByTestId('invoice-number').innerText());
    await expect(page.getByTestId('invoice-panel-status')).toHaveText('Overdue');
    await expect.poll(() => auditLines()).toContain('INTEREST_WAIVED id=1 amount=2.88');
  });
});
