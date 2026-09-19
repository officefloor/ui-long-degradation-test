import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// Validation surfaced in the UI (the @error category). Assert the error anchor is shown and no row
// is created — never the exact wording (copy is not part of the contract).
test.describe('owner email validation', () => {
  test('rejects a blank email', { tag: '@error' }, async ({ page }) => {
    await resetAndSeed({ owners: [] });
    await page.goto('/');
    await page.getByTestId('nav-owners').click();

    await page.getByTestId('owner-form-name').fill('No Email Co');
    await page.getByTestId('owner-form-email').fill('');
    await page.getByTestId('owner-form-submit').click();

    await expect(page.getByTestId('owner-form-email-error')).toBeVisible();
    await expect(page.getByTestId(/^owner-row-/)).toHaveCount(0);
  });

  test('rejects a malformed email', { tag: '@error' }, async ({ page }) => {
    await resetAndSeed({ owners: [] });
    await page.goto('/');
    await page.getByTestId('nav-owners').click();

    await page.getByTestId('owner-form-name').fill('Bad Email Co');
    await page.getByTestId('owner-form-email').fill('not-an-email');
    await page.getByTestId('owner-form-submit').click();

    await expect(page.getByTestId('owner-form-email-error')).toBeVisible();
    await expect(page.getByTestId(/^owner-row-/)).toHaveCount(0);
  });

  test('accepts a valid email', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({ owners: [] });
    await page.goto('/');
    await page.getByTestId('nav-owners').click();

    await page.getByTestId('owner-form-name').fill('Good Co');
    await page.getByTestId('owner-form-email').fill('hi@good.example');
    await page.getByTestId('owner-form-submit').click();

    await expect(page.getByTestId(/^owner-row-/)).toHaveCount(1);
    await expect(page.getByTestId('owner-form-email-error')).toHaveCount(0);
  });
});
