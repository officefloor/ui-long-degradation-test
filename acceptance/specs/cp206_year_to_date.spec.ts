import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// The home screen shows year-to-date billings and collections.
test.describe('year to date', () => {
  test('totals billings and collections for the year so far', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-06-01',
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      projects: [{ id: 1, name: 'A', clientId: 1 }],
      invoices: [
        { id: 1, projectId: 1, status: 'SENT', issueDate: '2026-02-01', lineItems: [{ id: 1, description: 'x', qty: 1, unitPrice: 300 }] },
        { id: 2, projectId: 1, status: 'SENT', issueDate: '2026-04-01', lineItems: [{ id: 2, description: 'y', qty: 1, unitPrice: 200 }] },
      ],
      payments: [{ id: 1, invoiceId: 1, amount: 300, date: '2026-03-01' }],
    });
    await page.goto('/');
    await page.getByTestId('nav-dashboard').click();
    await expect(page.getByTestId('kpi-ytd-billings')).toHaveText('$500.00');
    await expect(page.getByTestId('kpi-ytd-collected')).toHaveText('$300.00');
  });
});
