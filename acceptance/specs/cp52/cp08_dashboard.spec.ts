import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// UPDATED (money shows a currency symbol; outstanding now counts SENT invoices only). Counts are
// unchanged; the outstanding total sums sent-and-unpaid invoices and shows "$".
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
        { id: 1, projectId: 1, amount: 100, status: 'SENT' },
        { id: 2, projectId: 1, amount: 50, status: 'PAID' },
        { id: 3, projectId: 2, amount: 200, status: 'SENT' },
      ],
    });
    await page.goto('/');
    await page.getByTestId('nav-dashboard').click();

    await expect(page.getByTestId('dashboard-clients-count')).toHaveText('2');
    await expect(page.getByTestId('dashboard-jobs-count')).toHaveText('2');
    await expect(page.getByTestId('dashboard-outstanding-total')).toHaveText('$300.00');
  });
});
