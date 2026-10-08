import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// Non-billable jobs are left out of the revenue-by-job figures.
test.describe('revenue excludes non-billable', () => {
  test('omits non-billable jobs', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      projects: [
        { id: 1, name: 'Billable', clientId: 1, billable: true },
        { id: 2, name: 'Internal', clientId: 1, billable: false },
      ],
      invoices: [
        { id: 1, projectId: 1, status: 'SENT', issueDate: '2026-02-05', lineItems: [{ id: 1, description: 'x', qty: 1, unitPrice: 300 }] },
        { id: 2, projectId: 2, status: 'SENT', issueDate: '2026-02-06', lineItems: [{ id: 2, description: 'y', qty: 1, unitPrice: 200 }] },
      ],
    });
    await page.goto('/');
    await page.getByTestId('nav-dashboard').click();
    await page.getByTestId('revenue-report-open').click();
    await expect(page.getByTestId('revenue-job-row-1').getByTestId('revenue-job-amount')).toHaveText('$300.00');
    await expect(page.getByTestId('revenue-job-row-2')).toHaveCount(0);
  });
});
