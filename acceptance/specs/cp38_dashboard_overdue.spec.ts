import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// The home screen shows how many SENT invoices are overdue. "Overdue" is measured against a fixed
// reference date the dashboard is given (seeded as asOf), so the result is deterministic.
test.describe('dashboard overdue', () => {
  test('counts sent invoices past their due date', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-03-01',
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      projects: [{ id: 1, name: 'Website Rebuild', clientId: 1 }],
      invoices: [
        { id: 1, projectId: 1, amount: 100, status: 'SENT', dueDate: '2026-02-01' },
        { id: 2, projectId: 1, amount: 100, status: 'SENT', dueDate: '2026-02-15' },
        { id: 3, projectId: 1, amount: 100, status: 'SENT', dueDate: '2026-04-01' },
        { id: 4, projectId: 1, amount: 100, status: 'DRAFT', dueDate: '2026-01-01' },
      ],
    });
    await page.goto('/');
    await page.getByTestId('nav-dashboard').click();

    // invoices 1 and 2 are sent and past 2026-03-01; 3 is future; 4 is a draft.
    await expect(page.getByTestId('dashboard-overdue-count')).toHaveText('2');
  });
});
