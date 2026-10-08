import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// Every money figure on the home screen leaves out written-off and disputed invoices in the same
// way, so outstanding and billings agree with each other.
test.describe('kpi exclusions consistent', () => {
  test('outstanding and billings both exclude disputed and written-off', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-02-28',
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example', currency: 'USD' }],
      projects: [{ id: 1, name: 'A', clientId: 1 }],
      invoices: [
        { id: 1, projectId: 1, status: 'SENT', issueDate: '2026-02-01', lineItems: [{ id: 1, description: 'x', qty: 1, unitPrice: 100 }] },
        { id: 2, projectId: 1, status: 'SENT', issueDate: '2026-02-02', disputed: true, lineItems: [{ id: 2, description: 'y', qty: 1, unitPrice: 200 }] },
        { id: 3, projectId: 1, status: 'WRITTEN_OFF', issueDate: '2026-02-03', lineItems: [{ id: 3, description: 'z', qty: 1, unitPrice: 50 }] },
      ],
    });
    await page.goto('/');
    await page.getByTestId('nav-dashboard').click();
    await expect(page.getByTestId('kpi-outstanding')).toHaveText('$100.00');
    await expect(page.getByTestId('kpi-billings-month')).toHaveText('$100.00');
  });
});
