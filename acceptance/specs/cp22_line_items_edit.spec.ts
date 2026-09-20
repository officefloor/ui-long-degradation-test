import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// Line items can be changed or removed; the invoice total recomputes.
test.describe('edit line items', () => {
  test('removing a line item lowers the total', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      projects: [{ id: 1, name: 'Website Rebuild', clientId: 1 }],
      invoices: [
        {
          id: 1, projectId: 1, status: 'DRAFT',
          lineItems: [
            { id: 1, description: 'Design', qty: 1, unitPrice: 100 },
            { id: 2, description: 'Hosting', qty: 1, unitPrice: 50 },
          ],
        },
      ],
    });
    await page.goto('/');
    await page.getByTestId('nav-projects').click();
    await page.getByTestId('project-open-1').click();
    await page.getByTestId('invoice-open-1').click();

    await expect(page.getByTestId('invoice-amount')).toHaveText('$150.00');
    await page.getByTestId('lineitem-remove-2').click();
    await expect(page.getByTestId(/^lineitem-row-/)).toHaveCount(1);
    await expect(page.getByTestId('invoice-amount')).toHaveText('$100.00');
  });
});
