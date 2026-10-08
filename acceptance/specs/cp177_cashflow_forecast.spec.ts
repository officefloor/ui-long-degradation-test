import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// A simple cash-flow forecast lists expected money in from scheduled instalments, by date.
test.describe('cash-flow forecast', () => {
  test('forecasts incoming money from instalments', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-02-01',
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example', currency: 'USD' }],
      projects: [{ id: 1, name: 'Website Rebuild', clientId: 1 }],
      invoices: [{
        id: 1, projectId: 1, status: 'SENT',
        lineItems: [{ id: 1, description: 'Work', qty: 1, unitPrice: 1000 }],
        instalments: [
          { id: 1, amount: 400, date: '2026-02-15', paid: false },
          { id: 2, amount: 600, date: '2026-03-15', paid: false },
        ],
      }],
    });
    await page.goto('/');
    await page.getByTestId('nav-dashboard').click();

    await expect(page.getByTestId('forecast-row-1').getByTestId('forecast-amount')).toHaveText('$400.00');
    await expect(page.getByTestId('forecast-row-2').getByTestId('forecast-amount')).toHaveText('$600.00');
    await expect(page.getByTestId('forecast-total')).toHaveText('$1,000.00');
  });
});
