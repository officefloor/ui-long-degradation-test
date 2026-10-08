import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// MUTATIVE (revises the top-clients rule). Top clients are ranked by their balance converted to the
// home currency, so clients in different currencies compare correctly. An updated top-clients spec
// ships in the sibling override folder.
test.describe('top clients by converted balance', () => {
  test('ranks across currencies by the converted home balance', { tag: '@core' }, async ({ page }) => {
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
});
