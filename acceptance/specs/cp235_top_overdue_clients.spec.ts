import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// The home screen shows the clients with the most overdue.
test.describe('top overdue clients', () => {
  test('ranks clients by overdue amount', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-03-01',
      clients: [
        { id: 1, name: 'Acme Ltd', email: 'a@ex.example', currency: 'USD' },
        { id: 2, name: 'Globex', email: 'b@ex.example', currency: 'USD' },
      ],
      projects: [
        { id: 1, name: 'A', clientId: 1 },
        { id: 2, name: 'B', clientId: 2 },
      ],
      invoices: [
        { id: 1, projectId: 1, status: 'SENT', dueDate: '2026-01-20', lineItems: [{ id: 1, description: 'x', qty: 1, unitPrice: 300 }] },
        { id: 2, projectId: 2, status: 'SENT', dueDate: '2026-01-20', lineItems: [{ id: 2, description: 'y', qty: 1, unitPrice: 100 }] },
      ],
    });
    await page.goto('/');
    await page.getByTestId('nav-dashboard').click();
    const rows = page.getByTestId('dashboard-top-overdue').getByTestId(/^overdue-client-row-/);
    await expect(rows.nth(0).getByTestId('overdue-client-name')).toHaveText('Acme Ltd');
    await expect(rows.nth(0).getByTestId('overdue-client-amount')).toHaveText('$300.00');
  });
});
