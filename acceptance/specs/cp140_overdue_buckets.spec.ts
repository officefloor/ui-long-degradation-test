import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// MUTATIVE (revises the dashboard-overdue rule). The overdue figure is split into age buckets by
// how overdue each invoice is, measured against the reference date. An updated overdue spec ships
// in the sibling override folder.
test.describe('overdue buckets', () => {
  test('splits overdue into age buckets', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-03-01',
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example', currency: 'USD' }],
      projects: [{ id: 1, name: 'Website Rebuild', clientId: 1 }],
      invoices: [
        { id: 1, projectId: 1, amount: 100, status: 'SENT', dueDate: '2026-02-25' },
        { id: 2, projectId: 1, amount: 100, status: 'SENT', dueDate: '2026-01-20' },
        { id: 3, projectId: 1, amount: 100, status: 'SENT', dueDate: '2025-12-01' },
      ],
    });
    await page.goto('/');
    await page.getByTestId('nav-dashboard').click();

    await expect(page.getByTestId('dashboard-overdue-0-30')).toHaveText('$100.00');
    await expect(page.getByTestId('dashboard-overdue-31-60')).toHaveText('$100.00');
    await expect(page.getByTestId('dashboard-overdue-60-plus')).toHaveText('$100.00');
  });
});
