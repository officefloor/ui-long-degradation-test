import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// The top-clients KPI tile uses the same converted balances as the top-clients list, so the two
// never disagree.
test.describe('top clients kpi consistency', () => {
  test('kpi tile matches the list', { tag: '@functionality' }, async ({ page }) => {
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
    const listTop = page.getByTestId('dashboard-top-clients').getByTestId(/^top-client-row-/).nth(0).getByTestId('top-client-amount');
    await expect(listTop).toHaveText('$300.00');
    await expect(page.getByTestId('kpi-top-client-row-1').getByTestId('kpi-top-client-amount')).toHaveText('$300.00');
  });
});
