import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// Validation surfaced in the UI (the @error category). Assert the error anchor is shown and no row
// is created — never the exact wording (copy is not part of the contract).
test.describe('client email validation', () => {
  test('rejects a blank email', { tag: '@error' }, async ({ page }) => {
    await resetAndSeed({ clients: [] });
    await page.goto('/');
    await page.getByTestId('nav-clients').click();

    await page.getByTestId('client-form-name').fill('No Email Co');
    await page.getByTestId('client-form-email').fill('');
    await page.getByTestId('client-form-submit').click();

    await expect(page.getByTestId('client-form-email-error')).toBeVisible();
    await expect(page.getByTestId(/^client-row-/)).toHaveCount(0);
  });

  test('rejects a malformed email', { tag: '@error' }, async ({ page }) => {
    await resetAndSeed({ clients: [] });
    await page.goto('/');
    await page.getByTestId('nav-clients').click();

    await page.getByTestId('client-form-name').fill('Bad Email Co');
    await page.getByTestId('client-form-email').fill('not-an-email');
    await page.getByTestId('client-form-submit').click();

    await expect(page.getByTestId('client-form-email-error')).toBeVisible();
    await expect(page.getByTestId(/^client-row-/)).toHaveCount(0);
  });

  test('accepts a valid email', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({ clients: [] });
    await page.goto('/');
    await page.getByTestId('nav-clients').click();

    await page.getByTestId('client-form-name').fill('Good Co');
    await page.getByTestId('client-form-email').fill('hi@good.example');
    await page.getByTestId('client-form-submit').click();

    await expect(page.getByTestId(/^client-row-/)).toHaveCount(1);
    await expect(page.getByTestId('client-form-email-error')).toHaveCount(0);
  });
});
