import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// The outstanding total on the home screen can be shown in a chosen base currency.
test.describe('dashboard base currency', () => {
  test('the chosen base currency is applied', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({ settings: { baseCurrency: 'USD' } });
    await page.goto('/');
    await page.getByTestId('nav-dashboard').click();
    await page.getByTestId('dashboard-base-currency-select').selectOption('EUR');
    await expect(page.getByTestId('dashboard-base-currency-select')).toHaveValue('EUR');
  });

  test('converts the outstanding total into the chosen currency', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      settings: { baseCurrency: 'USD' },
      fxRates: [{ currency: 'EUR', date: '2026-02-01', rate: 1.10 }],
      clients: [{ id: 1, name: 'Dollar Co', email: 'a@ex.example', currency: 'USD' }],
      projects: [{ id: 1, name: 'A', clientId: 1 }],
      invoices: [{ id: 1, projectId: 1, status: 'SENT', issueDate: '2026-02-01', lineItems: [{ id: 1, description: 'x', qty: 1, unitPrice: 110 }] }],
    });
    await page.goto('/');
    await page.getByTestId('nav-dashboard').click();
    await expect(page.getByTestId('kpi-outstanding')).toHaveText('$110.00');

    await page.getByTestId('dashboard-base-currency-select').selectOption('EUR');
    await expect(page.getByTestId('kpi-outstanding')).toHaveText('€100.00'); // $110 at 1.10
  });
});
