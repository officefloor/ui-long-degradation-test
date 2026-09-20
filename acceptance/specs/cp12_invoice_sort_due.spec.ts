import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// Sort a project's invoices by due date (ascending). Reuse pressure on the project invoices list.
test.describe('sort invoices by due date', () => {
  test('sorts the invoices earliest due first', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      projects: [{ id: 1, name: 'Website Rebuild', clientId: 1 }],
      invoices: [
        { id: 1, projectId: 1, amount: 100, status: 'SENT', issuedDate: '2026-01-01', dueDate: '2026-03-01' },
        { id: 2, projectId: 1, amount: 50, status: 'SENT', issuedDate: '2026-01-02', dueDate: '2026-01-15' },
      ],
    });
    await page.goto('/');
    await page.getByTestId('nav-projects').click();
    await page.getByTestId('project-open-1').click();

    await page.getByTestId('invoice-sort-due').click();
    const rows = page.getByTestId(/^invoice-row-/);
    await expect(rows.nth(0).getByTestId('invoice-due')).toHaveText('2026-01-15');
    await expect(rows.nth(1).getByTestId('invoice-due')).toHaveText('2026-03-01');
  });
});
