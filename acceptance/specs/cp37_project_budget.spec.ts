import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// A project can have a budget. Its detail shows the budget, how much has been invoiced, and what is
// left (budget minus invoiced).
test.describe('project budget', () => {
  test('shows budget, invoiced and remaining', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      projects: [{ id: 1, name: 'Website Rebuild', clientId: 1, budget: 1000 }],
      invoices: [
        { id: 1, projectId: 1, status: 'SENT', lineItems: [{ id: 1, description: 'A', qty: 1, unitPrice: 300 }] },
        { id: 2, projectId: 1, status: 'SENT', lineItems: [{ id: 2, description: 'B', qty: 1, unitPrice: 200 }] },
      ],
    });
    await page.goto('/');
    await page.getByTestId('nav-projects').click();
    await page.getByTestId('project-open-1').click();

    await expect(page.getByTestId('project-budget')).toHaveText('$1,000.00');
    await expect(page.getByTestId('project-invoiced')).toHaveText('$500.00');
    await expect(page.getByTestId('project-remaining')).toHaveText('$500.00');
  });
});
