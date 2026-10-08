import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// MUTATIVE (revises the multi-currency rule). The home screen gains one grand total in the home
// currency, converting each invoice at its own date's rate, while the per-currency rows stay.
test.describe('dashboard converted grand total', () => {
  test('shows a home-currency grand total across currencies', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      fxRates: [{ currency: 'EUR', date: '2026-02-01', rate: 1.10 }],
      clients: [
        { id: 1, name: 'Acme Ltd', email: 'ops@acme.example', currency: 'USD' },
        { id: 2, name: 'Globex', email: 'ac@globex.example', currency: 'EUR' },
      ],
      projects: [
        { id: 1, name: 'Website Rebuild', clientId: 1 },
        { id: 2, name: 'Intranet', clientId: 2 },
      ],
      invoices: [
        { id: 1, projectId: 1, status: 'SENT', issueDate: '2026-02-01', lineItems: [{ id: 1, description: 'A', qty: 1, unitPrice: 100 }] },
        { id: 2, projectId: 2, status: 'SENT', issueDate: '2026-02-01', lineItems: [{ id: 2, description: 'B', qty: 1, unitPrice: 200 }] },
      ],
    });
    await page.goto('/');
    await page.getByTestId('nav-dashboard').click();

    await expect(page.getByTestId('dashboard-outstanding-USD')).toHaveText('$100.00');
    await expect(page.getByTestId('dashboard-outstanding-EUR')).toHaveText('€200.00');
    await expect(page.getByTestId('dashboard-outstanding-home')).toHaveText('$320.00');
  });
});
