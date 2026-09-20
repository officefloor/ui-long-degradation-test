import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// Validation on the invoice form (the @error category): an invoice amount must be a positive number.
// Reject zero/negative with an error and add no row; a positive amount still works.
test.describe('invoice amount validation', () => {
  test('rejects a non-positive amount', { tag: '@error' }, async ({ page }) => {
    await resetAndSeed({
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      projects: [{ id: 1, name: 'Website Rebuild', clientId: 1 }],
      invoices: [],
    });
    await page.goto('/');
    await page.getByTestId('nav-projects').click();
    await page.getByTestId('project-open-1').click();

    await page.getByTestId('invoice-form-amount').fill('0');
    await page.getByTestId('invoice-form-submit').click();

    await expect(page.getByTestId('invoice-form-amount-error')).toBeVisible();
    await expect(page.getByTestId(/^invoice-row-/)).toHaveCount(0);
  });

  test('accepts a positive amount', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      projects: [{ id: 1, name: 'Website Rebuild', clientId: 1 }],
      invoices: [],
    });
    await page.goto('/');
    await page.getByTestId('nav-projects').click();
    await page.getByTestId('project-open-1').click();

    await page.getByTestId('invoice-form-amount').fill('75');
    await page.getByTestId('invoice-form-submit').click();

    await expect(page.getByTestId(/^invoice-row-/)).toHaveCount(1);
    await expect(page.getByTestId('invoice-form-amount-error')).toHaveCount(0);
  });
});
