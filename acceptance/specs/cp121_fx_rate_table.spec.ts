import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// An exchange rate for a currency on a date is recorded in Settings and listed in the rate history.
test.describe('exchange rate table', () => {
  test('records a rate for a currency on a date', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({});
    await page.goto('/');
    await page.getByTestId('nav-settings').click();

    await page.getByTestId('fx-rate-form-currency').fill('EUR');
    await page.getByTestId('fx-rate-form-date').fill('2026-02-01');
    await page.getByTestId('fx-rate-form-rate').fill('1.10');
    await page.getByTestId('fx-rate-form-submit').click();

    await expect(page.getByTestId('fx-rate-row-1').getByTestId('fx-rate-currency')).toHaveText('EUR');
    await expect(page.getByTestId('fx-rate-row-1').getByTestId('fx-rate-value')).toHaveText('1.10');
  });
});
