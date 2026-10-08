import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// UPDATED top-clients spec: carries the per-currency and converted-home ranking forward, and ties
// the KPI tile figures to the same balances the list uses.
test.describe('dashboard top clients', () => {
  test('ranks clients by outstanding, shown in their currency', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      clients: [
        { id: 1, name: 'Acme Ltd', email: 'a@ex.example', currency: 'EUR' },
        { id: 2, name: 'Globex', email: 'b@ex.example', currency: 'EUR' },
        { id: 3, name: 'Initech', email: 'c@ex.example', currency: 'EUR' },
      ],
      projects: [
        { id: 1, name: 'A', clientId: 1 },
        { id: 2, name: 'B', clientId: 2 },
        { id: 3, name: 'C', clientId: 3 },
      ],
      invoices: [
        { id: 1, projectId: 1, status: 'SENT', lineItems: [{ id: 1, description: 'x', qty: 1, unitPrice: 100 }] },
        { id: 2, projectId: 2, status: 'SENT', lineItems: [{ id: 2, description: 'y', qty: 1, unitPrice: 300 }] },
        { id: 3, projectId: 3, status: 'SENT', lineItems: [{ id: 3, description: 'z', qty: 1, unitPrice: 200 }] },
      ],
    });
    await page.goto('/');
    await page.getByTestId('nav-dashboard').click();
    const rows = page.getByTestId('dashboard-top-clients').getByTestId(/^top-client-row-/);
    await expect(rows.nth(0).getByTestId('top-client-name')).toHaveText('Globex');
    await expect(rows.nth(0).getByTestId('top-client-amount')).toHaveText('€300.00');
    await expect(rows.nth(1).getByTestId('top-client-name')).toHaveText('Initech');
  });

  test('ranks across currencies by the converted home balance', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      fxRates: [{ currency: 'EUR', date: '2026-02-01', rate: 1.10 }],
      clients: [
        { id: 1, name: 'Dollar Co', email: 'a@ex.example', currency: 'USD' },
        { id: 2, name: 'Euro Co', email: 'b@ex.example', currency: 'EUR' },
      ],
      projects: [
        { id: 1, name: 'A', clientId: 1 },
        { id: 2, name: 'B', clientId: 2 },
      ],
      invoices: [
        { id: 1, projectId: 1, status: 'SENT', issueDate: '2026-02-01', lineItems: [{ id: 1, description: 'x', qty: 1, unitPrice: 300 }] },
        { id: 2, projectId: 2, status: 'SENT', issueDate: '2026-02-01', lineItems: [{ id: 2, description: 'y', qty: 1, unitPrice: 290 }] },
      ],
    });
    await page.goto('/');
    await page.getByTestId('nav-dashboard').click();
    const rows = page.getByTestId('dashboard-top-clients').getByTestId(/^top-client-row-/);
    await expect(rows.nth(0).getByTestId('top-client-name')).toHaveText('Euro Co');
    await expect(rows.nth(1).getByTestId('top-client-name')).toHaveText('Dollar Co');
  });

  test('the kpi tile matches the list amounts', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      clients: [
        { id: 1, name: 'Acme Ltd', email: 'a@ex.example', currency: 'USD' },
        { id: 2, name: 'Globex', email: 'b@ex.example', currency: 'USD' },
      ],
      projects: [
        { id: 1, name: 'A', clientId: 1 },
        { id: 2, name: 'B', clientId: 2 },
      ],
      invoices: [
        { id: 1, projectId: 1, status: 'SENT', lineItems: [{ id: 1, description: 'x', qty: 1, unitPrice: 300 }] },
        { id: 2, projectId: 2, status: 'SENT', lineItems: [{ id: 2, description: 'y', qty: 1, unitPrice: 100 }] },
      ],
    });
    await page.goto('/');
    await page.getByTestId('nav-dashboard').click();
    await expect(page.getByTestId('kpi-top-client-row-1').getByTestId('kpi-top-client-amount')).toHaveText('$300.00');
  });
});
