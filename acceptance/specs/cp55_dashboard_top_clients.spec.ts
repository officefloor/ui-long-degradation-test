import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// The home screen shows the top five clients ranked by how much they owe.
test.describe('dashboard top clients', () => {
  test('ranks clients by outstanding', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      clients: [
        { id: 1, name: 'Acme Ltd', email: 'a@ex.example' },
        { id: 2, name: 'Globex', email: 'b@ex.example' },
        { id: 3, name: 'Initech', email: 'c@ex.example' },
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
    await expect(rows).toHaveCount(3);
    await expect(rows.nth(0).getByTestId('top-client-name')).toHaveText('Globex');
    await expect(rows.nth(0).getByTestId('top-client-amount')).toHaveText('$300.00');
    await expect(rows.nth(1).getByTestId('top-client-name')).toHaveText('Initech');
  });
});
