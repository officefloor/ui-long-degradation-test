import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// UPDATED tax-summary spec after the levy was scrapped: carries the period total forward; the
// split into main tax and levy is retired.
test.describe('tax summary report', () => {
  test('totals the tax charged over a period', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      projects: [{ id: 1, name: 'Website Rebuild', clientId: 1 }],
      invoices: [
        { id: 1, projectId: 1, status: 'SENT', issueDate: '2026-02-05', taxPct: 20, lineItems: [{ id: 1, description: 'A', qty: 1, unitPrice: 100 }] },
        { id: 2, projectId: 1, status: 'SENT', issueDate: '2026-02-20', taxPct: 20, lineItems: [{ id: 2, description: 'B', qty: 1, unitPrice: 200 }] },
        { id: 3, projectId: 1, status: 'SENT', issueDate: '2026-04-01', taxPct: 20, lineItems: [{ id: 3, description: 'C', qty: 1, unitPrice: 500 }] },
      ],
    });
    await page.goto('/');
    await page.getByTestId('nav-dashboard').click();
    await page.getByTestId('tax-summary-open').click();
    await page.getByTestId('tax-summary-from').fill('2026-02-01');
    await page.getByTestId('tax-summary-to').fill('2026-02-28');
    await page.getByTestId('tax-summary-apply').click();
    await expect(page.getByTestId('tax-summary-total')).toHaveText('$60.00');
    await expect(page.getByTestId('tax-summary-levy')).toHaveCount(0);
  });
});
