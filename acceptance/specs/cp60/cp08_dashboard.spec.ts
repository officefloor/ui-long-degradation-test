import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// UPDATED for cp60 (mutates 8): the single outstanding total is replaced by per-currency totals.
// Counts are unchanged; outstanding still counts SENT invoices only, now split by client currency.
test.describe('dashboard', () => {
  test('shows counts and per-currency outstanding totals', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      clients: [
        { id: 1, name: 'Acme Ltd', email: 'ops@acme.example', currency: 'USD' },
        { id: 2, name: 'Globex', email: 'ac@globex.example', currency: 'EUR' },
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
    await expect(page.getByTestId('dashboard-projects-count')).toHaveText('2');
    await expect(page.getByTestId('dashboard-outstanding-USD')).toHaveText('$100.00');
    await expect(page.getByTestId('dashboard-outstanding-EUR')).toHaveText('€200.00');
  });
});
