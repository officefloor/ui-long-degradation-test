import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// Every money figure on the home screen is shown in the chosen base currency, converted
// consistently.
test.describe('dashboard base-currency money', () => {
  test('converts outstanding into the base currency', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      settings: { baseCurrency: 'EUR' },
      fxRates: [{ currency: 'EUR', date: '2026-02-01', rate: 1.10 }],
      clients: [{ id: 1, name: 'Dollar Co', email: 'a@ex.example', currency: 'USD' }],
      projects: [{ id: 1, name: 'A', clientId: 1 }],
      invoices: [{ id: 1, projectId: 1, status: 'SENT', issueDate: '2026-02-01', lineItems: [{ id: 1, description: 'x', qty: 1, unitPrice: 110 }] }],
    });
    await page.goto('/');
    await page.getByTestId('nav-dashboard').click();
    await expect(page.getByTestId('kpi-outstanding')).toHaveText('€100.00');
  });
});
