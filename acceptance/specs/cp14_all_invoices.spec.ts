import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// One place listing every invoice across all projects, with its project name and stage.
test.describe('all invoices', () => {
  test('lists invoices from every project with project and status', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      projects: [
        { id: 1, name: 'Website Rebuild', clientId: 1 },
        { id: 2, name: 'Intranet', clientId: 1 },
      ],
      invoices: [
        { id: 1, projectId: 1, amount: 100, status: 'SENT' },
        { id: 2, projectId: 2, amount: 50, status: 'DRAFT' },
      ],
    });
    await page.goto('/');
    await page.getByTestId('nav-invoices').click();

    await expect(page.getByTestId('all-invoices-table')).toBeVisible();
    await expect(page.getByTestId(/^invoice-row-/)).toHaveCount(2);
    await expect(page.getByTestId('invoice-row-1').getByTestId('invoice-project')).toHaveText('Website Rebuild');
    await expect(page.getByTestId('invoice-row-1').getByTestId('invoice-status')).toHaveText('SENT');
    await expect(page.getByTestId('invoice-row-2').getByTestId('invoice-project')).toHaveText('Intranet');
    await expect(page.getByTestId('invoice-row-2').getByTestId('invoice-status')).toHaveText('DRAFT');
  });
});
