import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// The overdue total shown per month.
test.describe('overdue trend', () => {
  test('shows the overdue amount for a month', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-02-28',
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      projects: [{ id: 1, name: 'A', clientId: 1 }],
      invoices: [
        { id: 1, projectId: 1, status: 'SENT', dueDate: '2026-02-10', lineItems: [{ id: 1, description: 'x', qty: 1, unitPrice: 100 }] },
      ],
    });
    await page.goto('/');
    await page.getByTestId('nav-dashboard').click();
    await page.getByTestId('overdue-trend-open').click();
    await expect(page.getByTestId('overdue-trend-row-2026-02').getByTestId('overdue-trend-amount')).toHaveText('$100.00');
  });
});
