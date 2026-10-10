import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// Validation on the invoice form (the @error category): an invoice amount must be more than zero and
// no more than $100,000. Reject zero, or anything over the limit, with an error and add no row; an
// amount within the range (up to and including $100,000) still works.
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

  test('rejects an amount over $100,000', { tag: '@error' }, async ({ page }) => {
    await resetAndSeed({
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      projects: [{ id: 1, name: 'Website Rebuild', clientId: 1 }],
      invoices: [],
    });
    await page.goto('/');
    await page.getByTestId('nav-projects').click();
    await page.getByTestId('project-open-1').click();

    await page.getByTestId('invoice-form-amount').fill('250000');
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

  test('accepts exactly $100,000', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      projects: [{ id: 1, name: 'Website Rebuild', clientId: 1 }],
      invoices: [],
    });
    await page.goto('/');
    await page.getByTestId('nav-projects').click();
    await page.getByTestId('project-open-1').click();

    await page.getByTestId('invoice-form-amount').fill('100000');
    await page.getByTestId('invoice-form-submit').click();

    await expect(page.getByTestId(/^invoice-row-/)).toHaveCount(1);
    await expect(page.getByTestId('invoice-form-amount-error')).toHaveCount(0);
  });
});
