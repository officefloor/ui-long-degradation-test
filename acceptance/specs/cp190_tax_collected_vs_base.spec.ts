import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// The tax report shows the taxable base alongside the tax collected, with totals.
test.describe('tax report base and tax', () => {
  test('shows the base and the tax per rate and in total', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      projects: [{ id: 1, name: 'Website Rebuild', clientId: 1 }],
      invoices: [
        { id: 1, projectId: 1, status: 'SENT', issueDate: '2026-02-05', taxPct: 20, lineItems: [{ id: 1, description: 'A', qty: 1, unitPrice: 100 }] },
        { id: 2, projectId: 1, status: 'SENT', issueDate: '2026-02-06', taxPct: 10, lineItems: [{ id: 2, description: 'B', qty: 1, unitPrice: 200 }] },
      ],
    });
    await page.goto('/');
    await page.getByTestId('nav-dashboard').click();
    await page.getByTestId('tax-report-open').click();
    await page.getByTestId('tax-report-from').fill('2026-02-01');
    await page.getByTestId('tax-report-to').fill('2026-02-28');
    await page.getByTestId('tax-report-apply').click();

    await expect(page.getByTestId('tax-report-row-20').getByTestId('tax-report-base')).toHaveText('$100.00');
    await expect(page.getByTestId('tax-report-total-base')).toHaveText('$300.00');
    await expect(page.getByTestId('tax-report-total-tax')).toHaveText('$40.00');
  });
});
