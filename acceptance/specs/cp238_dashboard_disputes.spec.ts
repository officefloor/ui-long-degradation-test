import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// The home screen shows how much is tied up in disputed invoices.
test.describe('dashboard disputes', () => {
  test('totals disputed invoices', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example', currency: 'USD' }],
      projects: [{ id: 1, name: 'A', clientId: 1 }],
      invoices: [
        { id: 1, projectId: 1, status: 'SENT', disputed: true, lineItems: [{ id: 1, description: 'x', qty: 1, unitPrice: 200 }] },
        { id: 2, projectId: 1, status: 'SENT', lineItems: [{ id: 2, description: 'y', qty: 1, unitPrice: 100 }] },
      ],
    });
    await page.goto('/');
    await page.getByTestId('nav-dashboard').click();
    await expect(page.getByTestId('dashboard-disputes-total')).toHaveText('$200.00');
  });
});
