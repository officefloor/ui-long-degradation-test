import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// An invoice's amount is the same figure everywhere it appears — the project list, the invoice
// detail, the client's outstanding total and the dashboard. A single SENT invoice of subtotal 200,
// 10% discount, 20% tax totals $216.00 and, unpaid, is outstanding in every place.
test.describe('amounts match across screens', () => {
  test('the same total shows on list, detail, client and dashboard', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example', currency: 'USD' }],
      projects: [{ id: 1, name: 'Website Rebuild', clientId: 1 }],
      invoices: [{ id: 1, projectId: 1, status: 'SENT', discountPct: 10, taxPct: 20, lineItems: [{ id: 1, description: 'Work', qty: 1, unitPrice: 200 }] }],
    });
    await page.goto('/');

    await page.getByTestId('nav-projects').click();
    await page.getByTestId('project-open-1').click();
    await expect(page.getByTestId('invoice-row-1').getByTestId('invoice-amount')).toHaveText('$216.00');
    await expect(page.getByTestId('invoice-row-1').getByTestId('invoice-due-amount')).toHaveText('$216.00');

    await page.getByTestId('invoice-open-1').click();
    await expect(page.getByTestId('invoice-amount')).toHaveText('$216.00');

    await page.getByTestId('nav-clients').click();
    await page.getByTestId('client-open-1').click();
    await expect(page.getByTestId('client-outstanding-total')).toHaveText('$216.00');

    await page.getByTestId('nav-dashboard').click();
    await expect(page.getByTestId('kpi-outstanding')).toHaveText('$216.00');
  });
});
