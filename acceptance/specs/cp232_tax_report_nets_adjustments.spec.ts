import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// The tax summary total takes account of any recorded tax adjustments.
test.describe('tax report nets adjustments', () => {
  test('nets a recorded adjustment into the total', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      projects: [{ id: 1, name: 'A', clientId: 1 }],
      invoices: [
        { id: 1, projectId: 1, status: 'SENT', issueDate: '2026-02-05', taxPct: 20, lineItems: [{ id: 1, description: 'x', qty: 1, unitPrice: 100 }] },
        { id: 2, projectId: 1, status: 'SENT', issueDate: '2026-02-20', taxPct: 20, lineItems: [{ id: 2, description: 'y', qty: 1, unitPrice: 200 }] },
      ],
      taxAdjustments: [{ id: 1, amount: -10, date: '2026-02-15' }],
    });
    await page.goto('/');
    await page.getByTestId('nav-dashboard').click();
    await page.getByTestId('tax-summary-open').click();
    await page.getByTestId('tax-summary-from').fill('2026-02-01');
    await page.getByTestId('tax-summary-to').fill('2026-02-28');
    await page.getByTestId('tax-summary-apply').click();
    await expect(page.getByTestId('tax-summary-total')).toHaveText('$50.00');
  });
});
