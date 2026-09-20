import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// UPDATED for cp09 (mutates: [4]): money is now shown with a currency symbol. Same behaviour as the
// original cp04, but amounts/total assert "$..." instead of "...". Installed by basename over the
// original cp04_project_invoices.spec.ts.
test.describe('project invoices', () => {
  test('a project shows its invoices and their total', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      projects: [{ id: 1, name: 'Website Rebuild', clientId: 1 }],
      invoices: [
        { id: 1, projectId: 1, amount: 100 },
        { id: 2, projectId: 1, amount: 50 },
      ],
    });
    await page.goto('/');
    await page.getByTestId('nav-projects').click();
    await page.getByTestId('project-open-1').click();

    await expect(page.getByTestId('project-invoices-table')).toBeVisible();
    await expect(page.getByTestId('invoice-row-1').getByTestId('invoice-amount')).toHaveText('$100.00');
    await expect(page.getByTestId('invoice-row-2').getByTestId('invoice-amount')).toHaveText('$50.00');
    await expect(page.getByTestId('project-invoices-total')).toHaveText('$150.00');
  });

  test('adds an invoice to a project', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      projects: [{ id: 1, name: 'Website Rebuild', clientId: 1 }],
      invoices: [],
    });
    await page.goto('/');
    await page.getByTestId('nav-projects').click();
    await page.getByTestId('project-open-1').click();

    await page.getByTestId('invoice-form-amount').fill('250');
    await page.getByTestId('invoice-form-submit').click();

    await expect(page.getByTestId(/^invoice-row-/)).toHaveCount(1);
    await expect(page.getByTestId(/^invoice-row-/).first().getByTestId('invoice-amount')).toHaveText('$250.00');
    await expect(page.getByTestId('project-invoices-total')).toHaveText('$250.00');
  });
});
