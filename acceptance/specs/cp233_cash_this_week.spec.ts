import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// The home screen shows cash collected this week.
test.describe('cash this week', () => {
  test('totals payments received in the current week', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-02-04',
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      projects: [{ id: 1, name: 'A', clientId: 1 }],
      invoices: [{ id: 1, projectId: 1, status: 'SENT', lineItems: [{ id: 1, description: 'x', qty: 1, unitPrice: 500 }] }],
      payments: [
        { id: 1, invoiceId: 1, amount: 200, date: '2026-02-03' },
        { id: 2, invoiceId: 1, amount: 100, date: '2026-01-25' },
      ],
    });
    await page.goto('/');
    await page.getByTestId('nav-dashboard').click();
    await expect(page.getByTestId('dashboard-cash-week')).toHaveText('$200.00');
  });
});
