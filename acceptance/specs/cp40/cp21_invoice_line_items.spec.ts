import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// UPDATED (thousands separators): a line-item invoice's amount shows commas.
test.describe('invoice line items', () => {
  test('invoice amount is the sum of its line items, with commas', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      projects: [{ id: 1, name: 'Website Rebuild', clientId: 1 }],
      invoices: [
        {
          id: 1, projectId: 1, status: 'DRAFT',
          lineItems: [
            { id: 1, description: 'Design', qty: 2, unitPrice: 500 },
            { id: 2, description: 'Development', qty: 1, unitPrice: 234.5 },
          ],
        },
      ],
    });
    await page.goto('/');
    await page.getByTestId('nav-projects').click();
    await page.getByTestId('project-open-1').click();
    await expect(page.getByTestId('invoice-row-1').getByTestId('invoice-amount')).toHaveText('$1,234.50');
  });
});
