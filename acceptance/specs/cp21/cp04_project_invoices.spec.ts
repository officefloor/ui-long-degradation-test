import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../../support/seed';

// UPDATED (money shows "$"; invoice amounts are now built from line items). A project still lists
// its invoices with a total, but each invoice's amount comes from its line items, and a new invoice
// is created then given line items rather than a single typed amount.
test.describe('project invoices', () => {
  test('a project shows its invoices and their total', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      projects: [{ id: 1, name: 'Website Rebuild', clientId: 1 }],
      invoices: [
        { id: 1, projectId: 1, status: 'DRAFT', lineItems: [{ id: 1, description: 'Design', qty: 1, unitPrice: 100 }] },
        { id: 2, projectId: 1, status: 'DRAFT', lineItems: [{ id: 2, description: 'Hosting', qty: 1, unitPrice: 50 }] },
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

  test('adding a line item to a new invoice sets its amount', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      projects: [{ id: 1, name: 'Website Rebuild', clientId: 1 }],
      invoices: [{ id: 1, projectId: 1, status: 'DRAFT', lineItems: [] }],
    });
    await page.goto('/');
    await page.getByTestId('nav-projects').click();
    await page.getByTestId('project-open-1').click();
    await page.getByTestId('invoice-open-1').click();

    await page.getByTestId('lineitem-form-description').fill('Build');
    await page.getByTestId('lineitem-form-qty').fill('1');
    await page.getByTestId('lineitem-form-unitprice').fill('250');
    await page.getByTestId('lineitem-form-submit').click();

    await expect(page.getByTestId('invoice-amount')).toHaveText('$250.00');
  });
});
