import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// MUTATIVE (revises the outstanding rule). What a client owes counts only sent invoices that are
// not cancelled and not written off. An updated outstanding spec ships in the sibling override
// folder.
test.describe('outstanding excludes written-off', () => {
  test('written-off invoices drop out of outstanding', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example', currency: 'USD' }],
      projects: [{ id: 1, name: 'Website Rebuild', clientId: 1 }],
      invoices: [
        { id: 1, projectId: 1, status: 'SENT', lineItems: [{ id: 1, description: 'A', qty: 1, unitPrice: 100 }] },
        { id: 2, projectId: 1, status: 'WRITTEN_OFF', lineItems: [{ id: 2, description: 'B', qty: 1, unitPrice: 50 }] },
      ],
    });
    await page.goto('/');
    await page.getByTestId('nav-dashboard').click();

    await expect(page.getByTestId('dashboard-outstanding-USD')).toHaveText('$100.00');
  });
});
