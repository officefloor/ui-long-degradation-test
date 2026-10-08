import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// The home screen shows the average number of days clients take to pay.
test.describe('kpi days to pay', () => {
  test('averages days from issue to payment', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      projects: [{ id: 1, name: 'A', clientId: 1 }],
      invoices: [
        { id: 1, projectId: 1, status: 'PAID', issueDate: '2026-02-01', lineItems: [{ id: 1, description: 'x', qty: 1, unitPrice: 100 }] },
        { id: 2, projectId: 1, status: 'PAID', issueDate: '2026-02-01', lineItems: [{ id: 2, description: 'y', qty: 1, unitPrice: 100 }] },
      ],
      payments: [
        { id: 1, invoiceId: 1, amount: 100, date: '2026-02-11' },
        { id: 2, invoiceId: 2, amount: 100, date: '2026-02-21' },
      ],
    });
    await page.goto('/');
    await page.getByTestId('nav-dashboard').click();
    await expect(page.getByTestId('kpi-days-to-pay')).toHaveText('15');
  });
});
