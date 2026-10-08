import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// MUTATIVE (revises the thousands-separator and multi-currency rules). Every amount, on every
// screen, is shown with the same rounding, the same thousands separators and the right currency.
// Updated copies of those specs ship in the sibling override folder. Here one euro client's large
// balance reads identically on the invoice list, the statement and the home screen.
test.describe('one money rule everywhere', () => {
  test('the same amount reads identically across screens', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      clients: [{ id: 1, name: 'Globex', email: 'ac@globex.example', currency: 'EUR' }],
      projects: [{ id: 1, name: 'Intranet', clientId: 1 }],
      invoices: [{ id: 1, projectId: 1, status: 'SENT', lineItems: [{ id: 1, description: 'Build', qty: 1, unitPrice: 1234.5 }] }],
    });
    await page.goto('/');

    await page.getByTestId('nav-projects').click();
    await page.getByTestId('project-open-1').click();
    await expect(page.getByTestId('invoice-row-1').getByTestId('invoice-amount')).toHaveText('€1,234.50');

    await page.getByTestId('nav-clients').click();
    await page.getByTestId('client-open-1').click();
    await page.getByTestId('client-statement-open').click();
    await expect(page.getByTestId('client-outstanding-total')).toHaveText('€1,234.50');

    await page.getByTestId('nav-dashboard').click();
    await expect(page.getByTestId('dashboard-outstanding-EUR')).toHaveText('€1,234.50');
  });
});
