import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// Narrow the all-invoices list to a single stage.
test.describe('filter invoices by status', () => {
  test('shows only invoices at the chosen stage', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      projects: [{ id: 1, name: 'Website Rebuild', clientId: 1 }],
      invoices: [
        { id: 1, projectId: 1, amount: 100, status: 'SENT' },
        { id: 2, projectId: 1, amount: 50, status: 'DRAFT' },
        { id: 3, projectId: 1, amount: 200, status: 'SENT' },
      ],
    });
    await page.goto('/');
    await page.getByTestId('nav-invoices').click();
    await expect(page.getByTestId(/^invoice-row-/)).toHaveCount(3);

    await page.getByTestId('invoice-status-filter').selectOption('SENT');
    await expect(page.getByTestId(/^invoice-row-/)).toHaveCount(2);
    await expect(page.getByTestId('invoice-row-1')).toBeVisible();
    await expect(page.getByTestId('invoice-row-2')).toHaveCount(0);
    await expect(page.getByTestId('invoice-row-3')).toBeVisible();
  });
});
