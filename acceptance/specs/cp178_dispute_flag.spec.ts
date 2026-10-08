import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// An invoice can be marked as disputed. It still counts as owed but is flagged.
test.describe('dispute flag', () => {
  test('marks an invoice disputed', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      projects: [{ id: 1, name: 'Website Rebuild', clientId: 1 }],
      invoices: [{ id: 1, projectId: 1, status: 'SENT', lineItems: [{ id: 1, description: 'Work', qty: 1, unitPrice: 100 }] }],
    });
    await page.goto('/');
    await page.getByTestId('nav-projects').click();
    await page.getByTestId('project-open-1').click();

    await page.getByTestId('invoice-dispute-1').click();
    await expect(page.getByTestId('invoice-row-1').getByTestId('invoice-status')).toHaveText('DISPUTED');
    await expect(page.getByTestId('invoice-row-1').getByTestId('invoice-due-amount')).toHaveText('$100.00');
  });
});
