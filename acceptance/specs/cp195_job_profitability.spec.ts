import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// A job's page shows its profitability: budget versus what has been invoiced.
test.describe('job profitability', () => {
  test('shows budget and invoiced for the job', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      projects: [{ id: 1, name: 'Website Rebuild', clientId: 1, budget: 1000 }],
      invoices: [
        { id: 1, projectId: 1, status: 'SENT', lineItems: [{ id: 1, description: 'A', qty: 1, unitPrice: 400 }] },
        { id: 2, projectId: 1, status: 'SENT', lineItems: [{ id: 2, description: 'B', qty: 1, unitPrice: 200 }] },
      ],
    });
    await page.goto('/');
    await page.getByTestId('nav-projects').click();
    await page.getByTestId('project-open-1').click();

    await expect(page.getByTestId('job-profit-budget')).toHaveText('$1,000.00');
    await expect(page.getByTestId('job-profit-invoiced')).toHaveText('$600.00');
  });
});
