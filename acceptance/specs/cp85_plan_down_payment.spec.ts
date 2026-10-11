import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// A plan can start with a down payment (invoices[].planDownPct, a percentage from the plan form):
// that percentage of the grand total, rounded down to the cent, is instalment 0, due on the issue
// date with no interest; the instalments are worked out on the rest by the plan's rule. Instalment
// 0 is paid first and falls overdue like any instalment.
test.describe('down payment on a plan', () => {
  test('takes a down payment before the instalments', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-01-31',
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      invoices: [
        { id: 1, clientId: 1, status: 'DRAFT', issueDate: '2026-01-31', dueDate: '2026-02-28',
          lineItems: [{ id: 1, description: 'Consulting', qty: 1, unitPrice: 1200 }] },
      ],
    });
    await page.goto('/');

    await page.getByTestId('client-row-1').click();
    await page.getByTestId('invoice-row-1').click();
    await page.getByTestId('plan-form-count').fill('6');
    await page.getByTestId('plan-form-rate').fill('9');
    await page.getByTestId('plan-form-down').fill('20');
    await page.getByTestId('plan-form-submit').click();
    // 20% of 1,200.00 = 240.00, due on the issue date, with no interest
    await expect(page.getByTestId('instalment-row-0').getByTestId('instalment-due')).toHaveText('2026-01-31');
    await expect(page.getByTestId('instalment-row-0').getByTestId('instalment-payment')).toHaveText('$240.00');
    await expect(page.getByTestId('instalment-row-0').getByTestId('instalment-balance')).toHaveText('$960.00');
    // the other 960.00 over 6 months at 9%: 960.00 x 0.0075 / (1 - 1.0075^-6) = 164.22, rounded up to 165.00
    await expect(page.getByTestId('instalment-row-1').getByTestId('instalment-payment')).toHaveText('$165.00');
    await expect(page.getByTestId('instalment-row-1').getByTestId('instalment-interest')).toHaveText('$7.20'); // 960.00 x 0.0075
    await expect(page.getByTestId('instalment-row-6').getByTestId('instalment-payment')).toHaveText('$160.26');
    await expect(page.getByTestId('instalment-row-6').getByTestId('instalment-balance')).toHaveText('$0.00');
    await expect(page.getByTestId('invoice-plan-total')).toHaveText('$1,225.26');
  });

  test('an unpaid down payment falls overdue like an instalment', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-02-20',
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      invoices: [
        { id: 2, clientId: 1, status: 'SENT', issueDate: '2026-02-01', dueDate: '2026-03-31', instalments: 3,
          instalmentRate: 0, planDownPct: 50,
          lineItems: [{ id: 1, description: 'Licence', qty: 1, unitPrice: 600 }] },
      ],
    });
    await page.goto('/');

    await page.getByTestId('client-row-1').click();
    // the 300.00 down payment was due on 2026-02-01, more than 7 days ago
    await expect(page.getByTestId('invoice-row-2').getByTestId('invoice-status')).toHaveText('Overdue');
    await expect(page.getByTestId('client-row-1').getByTestId('client-overdue')).toHaveText('$300.00');
    await page.getByTestId('invoice-row-2').click();
    await expect(page.getByTestId('instalment-row-0').getByTestId('instalment-status')).toHaveText('Overdue');
    await expect(page.getByTestId('instalment-row-1').getByTestId('instalment-status')).toHaveText('Due');
  });
});
