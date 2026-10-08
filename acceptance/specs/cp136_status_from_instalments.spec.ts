import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// MUTATIVE (revises the derived-status rule). An invoice on an instalment plan is BEHIND when a due
// instalment is unpaid against the reference date. An updated status spec ships in the sibling
// override folder.
test.describe('status from instalments', () => {
  test('an overdue unpaid instalment shows the invoice as behind', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-02-15',
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      projects: [{ id: 1, name: 'Website Rebuild', clientId: 1 }],
      invoices: [{
        id: 1, projectId: 1, status: 'SENT',
        lineItems: [{ id: 1, description: 'Work', qty: 1, unitPrice: 1000 }],
        instalments: [
          { id: 1, amount: 400, date: '2026-02-01', paid: false },
          { id: 2, amount: 600, date: '2026-03-01', paid: false },
        ],
      }],
    });
    await page.goto('/');
    await page.getByTestId('nav-projects').click();
    await page.getByTestId('project-open-1').click();

    await expect(page.getByTestId('invoice-row-1').getByTestId('invoice-status')).toHaveText('BEHIND');
  });
});
