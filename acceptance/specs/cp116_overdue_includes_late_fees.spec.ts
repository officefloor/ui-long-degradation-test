import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// MUTATIVE (revises the dashboard-overdue rule). The home-screen overdue figure now includes the
// late fees that have accrued, not only the original amounts. An updated copy of the
// dashboard-overdue spec ships in the sibling override folder. Here a 100 invoice 10 days overdue
// at $1/day shows $110 overdue.
test.describe('overdue includes late fees', () => {
  test('overdue amount adds accrued late fees', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-03-01',
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example', currency: 'USD' }],
      projects: [{ id: 1, name: 'Website Rebuild', clientId: 1 }],
      invoices: [{ id: 1, projectId: 1, status: 'SENT', dueDate: '2026-02-19', lateFeePerDay: 1, lineItems: [{ id: 1, description: 'Work', qty: 1, unitPrice: 100 }] }],
    });
    await page.goto('/');
    await page.getByTestId('nav-dashboard').click();

    await expect(page.getByTestId('dashboard-overdue-amount')).toHaveText('$110.00');
  });
});
