import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// Cross-feature aggregate: a dashboard summarising all three entities. Outstanding total = sum of
// UNPAID invoice amounts across all projects.
test.describe('dashboard', () => {
  test('shows counts and the outstanding total', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      clients: [
        { id: 1, name: 'Acme Ltd', email: 'ops@acme.example' },
        { id: 2, name: 'Globex', email: 'ac@globex.example' },
      ],
      projects: [
        { id: 1, name: 'Website Rebuild', clientId: 1 },
        { id: 2, name: 'Intranet', clientId: 2 },
      ],
      invoices: [
        { id: 1, projectId: 1, amount: 100, status: 'UNPAID' },
        { id: 2, projectId: 1, amount: 50, status: 'PAID' },
        { id: 3, projectId: 2, amount: 200, status: 'UNPAID' },
      ],
    });
    await page.goto('/');
    await page.getByTestId('nav-dashboard').click();

    await expect(page.getByTestId('dashboard-clients-count')).toHaveText('2');
    await expect(page.getByTestId('dashboard-projects-count')).toHaveText('2');
    await expect(page.getByTestId('dashboard-outstanding-total')).toHaveText('300.00'); // 100 + 200 unpaid
  });
});
