import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// A manual tax adjustment can be recorded for a period and is listed.
test.describe('tax adjustment', () => {
  test('records a tax adjustment', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({});
    await page.goto('/');
    await page.getByTestId('nav-dashboard').click();
    await page.getByTestId('tax-summary-open').click();
    await page.getByTestId('tax-adjustment-amount').fill('-10');
    await page.getByTestId('tax-adjustment-date').fill('2026-02-15');
    await page.getByTestId('tax-adjustment-submit').click();

    await expect(page.getByTestId('tax-adjustment-row-1').getByTestId('tax-adjustment-row-amount')).toHaveText('-$10.00');
  });
});
