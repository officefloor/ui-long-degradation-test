import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// With a holiday calendar, a payment dated on a Saturday, a Sunday or a holiday (as observed)
// counts as received on the next business day: late interest runs to that day, and it is the paid
// date (for Paid late and the risk score) and the date judged for the early-payment window.
test.describe('payments on non-business days', () => {
  test('a payment dated on a weekend counts from the next business day', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-06-10',
      settings: { taxRate: 10, lateInterestRate: 12, holidays: ['2026-06-19'] },
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example', graceDays: 3 }],
      invoices: [
        { id: 1, clientId: 1, status: 'SENT', issueDate: '2026-05-01', dueDate: '2026-06-01',
          lineItems: [{ id: 1, description: 'Build', qty: 1, unitPrice: 1000 }] },
      ],
    });
    await page.goto('/');

    await page.getByTestId('client-row-1').click();
    await page.getByTestId('invoice-row-1').click();
    // due Monday 2026-06-01; 3 business days of grace end Thursday 2026-06-04
    await page.getByTestId('payment-form-amount').fill('1100');
    await page.getByTestId('payment-form-date').fill('2026-06-06');
    await page.getByTestId('payment-form-submit').click();
    // paid on Saturday 2026-06-06, received Monday 2026-06-08: 4 days of interest on 1,100.00 at 12%,
    // 1,100.00 x ((1 + 0.12/360)^4 - 1) = 1.4678 -> 1.47, still owed (counting to Saturday would give 0.73)
    await expect(page.getByTestId('invoice-interest')).toHaveText('$1.47');
    await expect(page.getByTestId('invoice-amount-due')).toHaveText('$1.47');
    await expect(page.getByTestId('invoice-panel-status')).toHaveText('Overdue');
  });

  test('a payment dated on a holiday counts from the next business day', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-06-24',
      settings: { taxRate: 10, lateInterestRate: 12, holidays: ['2026-06-19'] },
      clients: [{ id: 2, name: 'Globex Corp', email: 'billing@globex.example', termsDays: 5 }],
      invoices: [
        { id: 2, clientId: 2, status: 'SENT', issueDate: '2026-06-11', dueDate: '2026-06-18',
          lineItems: [{ id: 2, description: 'Design', qty: 1, unitPrice: 100 }] },
      ],
    });
    await page.goto('/');

    await page.getByTestId('client-row-2').click();
    await page.getByTestId('invoice-row-2').click();
    await page.getByTestId('payment-form-amount').fill('110');
    await page.getByTestId('payment-form-date').fill('2026-06-19');
    await page.getByTestId('payment-form-submit').click();
    // paid on the 2026-06-19 holiday, received Monday 2026-06-22, after the 2026-06-18 due date
    await expect(page.getByTestId('invoice-panel-status')).toHaveText('Paid late');
    await expect(page.getByTestId('invoice-paid-date')).toHaveText('2026-06-22');
  });
});
