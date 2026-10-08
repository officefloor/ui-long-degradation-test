import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// MUTATIVE (revises the derived-status rule). A disputed invoice shows its own distinct status and
// still counts as owed, but is kept out of the normal overdue chase. An updated status spec ships
// in the sibling override folder.
test.describe('disputed status', () => {
  test('a disputed invoice shows a distinct status and still counts as owed', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      projects: [{ id: 1, name: 'Website Rebuild', clientId: 1 }],
      invoices: [{ id: 1, projectId: 1, status: 'SENT', disputed: true, lineItems: [{ id: 1, description: 'Work', qty: 1, unitPrice: 100 }] }],
    });
    await page.goto('/');
    await page.getByTestId('nav-projects').click();
    await page.getByTestId('project-open-1').click();

    await expect(page.getByTestId('invoice-row-1').getByTestId('invoice-status')).toHaveText('DISPUTED');
    await expect(page.getByTestId('invoice-row-1').getByTestId('invoice-due-amount')).toHaveText('$100.00');
  });
});
