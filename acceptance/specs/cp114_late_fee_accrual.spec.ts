import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// A late fee accrues on a sent invoice that is overdue, at a set amount per day late, measured
// against the dashboard's reference date. Here $1/day, 10 days late = $10.
test.describe('late fee accrual', () => {
  test('accrues a per-day late fee', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-03-01',
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      projects: [{ id: 1, name: 'Website Rebuild', clientId: 1 }],
      invoices: [{ id: 1, projectId: 1, status: 'SENT', dueDate: '2026-02-19', lateFeePerDay: 1, lineItems: [{ id: 1, description: 'Work', qty: 1, unitPrice: 100 }] }],
    });
    await page.goto('/');
    await page.getByTestId('nav-projects').click();
    await page.getByTestId('project-open-1').click();
    await page.getByTestId('invoice-open-1').click();

    await expect(page.getByTestId('invoice-late-fee')).toHaveText('$10.00');
  });
});
