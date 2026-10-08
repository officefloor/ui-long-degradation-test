import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// UPDATED dashboard spec: carries the counts and per-currency outstanding forward, and adds the
// home-currency outstanding figure that leaves out disputed and written-off invoices.
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

  test('home-currency outstanding excludes disputed and written-off', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example', currency: 'USD' }],
      projects: [{ id: 1, name: 'A', clientId: 1 }],
      invoices: [
        { id: 1, projectId: 1, status: 'SENT', lineItems: [{ id: 1, description: 'x', qty: 1, unitPrice: 100 }] },
        { id: 2, projectId: 1, status: 'SENT', disputed: true, lineItems: [{ id: 2, description: 'y', qty: 1, unitPrice: 200 }] },
        { id: 3, projectId: 1, status: 'WRITTEN_OFF', lineItems: [{ id: 3, description: 'z', qty: 1, unitPrice: 50 }] },
      ],
    });
    await page.goto('/');
    await page.getByTestId('nav-dashboard').click();
    await expect(page.getByTestId('kpi-outstanding')).toHaveText('$100.00');
  });
});
