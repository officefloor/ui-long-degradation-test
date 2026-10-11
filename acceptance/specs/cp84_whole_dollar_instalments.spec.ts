import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// The equal monthly instalment of a plan is rounded up to the next whole dollar (whole currency
// unit) instead of half up to the cent; interest is still worked out each month on the balance and
// rounded half up to the cent, and the last instalment still pays whatever is left plus its
// interest, so it comes out smaller and the schedule ends at zero.
test.describe('whole-dollar instalments', () => {
  test('rounds the instalment up to a whole dollar', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-01-31',
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      invoices: [
        { id: 1, clientId: 1, status: 'DRAFT', issueDate: '2026-01-31', dueDate: '2026-02-28',
          lineItems: [{ id: 1, description: 'Consulting', qty: 1, unitPrice: 2400 }] },
      ],
    });
    await page.goto('/');

    await page.getByTestId('client-row-1').click();
    await page.getByTestId('invoice-row-1').click();
    await page.getByTestId('plan-form-count').fill('6');
    await page.getByTestId('plan-form-rate').fill('9');
    await page.getByTestId('plan-form-submit').click();
    // i = 9 / 12 / 100 = 0.0075; 2,400.00 x 0.0075 / (1 - 1.0075^-6) = 410.5617, rounded up to 411.00;
    // the last instalment pays what is left, so it comes out smaller
    await expect(page.getByTestId('instalment-row-1').getByTestId('instalment-due')).toHaveText('2026-02-28');
    await expect(page.getByTestId('instalment-row-1').getByTestId('instalment-payment')).toHaveText('$411.00');
    await expect(page.getByTestId('instalment-row-1').getByTestId('instalment-interest')).toHaveText('$18.00');
    await expect(page.getByTestId('instalment-row-1').getByTestId('instalment-principal')).toHaveText('$393.00');
    await expect(page.getByTestId('instalment-row-1').getByTestId('instalment-balance')).toHaveText('$2,007.00');
    await expect(page.getByTestId('instalment-row-6').getByTestId('instalment-due')).toHaveText('2026-07-31');
    await expect(page.getByTestId('instalment-row-6').getByTestId('instalment-payment')).toHaveText('$408.34');
    await expect(page.getByTestId('instalment-row-6').getByTestId('instalment-interest')).toHaveText('$3.04');
    await expect(page.getByTestId('instalment-row-6').getByTestId('instalment-principal')).toHaveText('$405.30');
    await expect(page.getByTestId('instalment-row-6').getByTestId('instalment-balance')).toHaveText('$0.00');
    await expect(page.getByTestId('invoice-plan-total')).toHaveText('$2,463.34');
  });
});
