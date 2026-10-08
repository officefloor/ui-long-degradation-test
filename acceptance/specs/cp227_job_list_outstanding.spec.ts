import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// The job list shows what is still outstanding on each job.
test.describe('job list outstanding', () => {
  test('shows outstanding per job', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      projects: [
        { id: 1, name: 'A', clientId: 1 },
        { id: 2, name: 'B', clientId: 1 },
      ],
      invoices: [
        { id: 1, projectId: 1, status: 'SENT', lineItems: [{ id: 1, description: 'x', qty: 1, unitPrice: 300 }] },
        { id: 2, projectId: 2, status: 'SENT', lineItems: [{ id: 2, description: 'y', qty: 1, unitPrice: 150 }] },
      ],
    });
    await page.goto('/');
    await page.getByTestId('nav-projects').click();
    await expect(page.getByTestId('project-row-1').getByTestId('project-outstanding')).toHaveText('$300.00');
    await expect(page.getByTestId('project-row-2').getByTestId('project-outstanding')).toHaveText('$150.00');
  });
});
