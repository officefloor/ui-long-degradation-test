import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// A standard tax rate is set once in Settings; a newly created invoice starts with that rate
// prefilled (and can still be changed on the invoice). Anchors: nav-settings, settings-default-
// tax-rate, settings-save; a new invoice is started from the project with invoice-new and shows
// its rate in invoice-tax-rate.
test.describe('default tax rate', () => {
  test('new invoices start with the default tax rate', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      projects: [{ id: 1, name: 'Website Rebuild', clientId: 1 }],
      invoices: [],
    });
    await page.goto('/');

    await page.getByTestId('nav-settings').click();
    await page.getByTestId('settings-default-tax-rate').fill('10');
    await page.getByTestId('settings-save').click();

    await page.getByTestId('nav-projects').click();
    await page.getByTestId('project-open-1').click();
    await page.getByTestId('invoice-new').click();

    await expect(page.getByTestId('invoice-tax-rate')).toHaveValue('10');
  });
});
