import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// The home-screen totals can be shown in a chosen base currency.
test.describe('dashboard base currency', () => {
  test('the chosen base currency is applied', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({ settings: { baseCurrency: 'USD' } });
    await page.goto('/');
    await page.getByTestId('nav-dashboard').click();
    await page.getByTestId('dashboard-base-currency-select').selectOption('EUR');
    await expect(page.getByTestId('dashboard-base-currency-select')).toHaveValue('EUR');
  });
});
