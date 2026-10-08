import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// Revenue for two periods compared side by side.
test.describe('compare periods', () => {
  test('shows each period total', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      projects: [{ id: 1, name: 'A', clientId: 1 }],
      invoices: [
        { id: 1, projectId: 1, status: 'SENT', issueDate: '2026-01-10', lineItems: [{ id: 1, description: 'x', qty: 1, unitPrice: 200 }] },
        { id: 2, projectId: 1, status: 'SENT', issueDate: '2026-02-10', lineItems: [{ id: 2, description: 'y', qty: 1, unitPrice: 300 }] },
      ],
    });
    await page.goto('/');
    await page.getByTestId('nav-dashboard').click();
    await page.getByTestId('revenue-report-open').click();
    await page.getByTestId('revenue-compare-a-from').fill('2026-01-01');
    await page.getByTestId('revenue-compare-a-to').fill('2026-01-31');
    await page.getByTestId('revenue-compare-b-from').fill('2026-02-01');
    await page.getByTestId('revenue-compare-b-to').fill('2026-02-28');
    await page.getByTestId('revenue-compare-apply').click();

    await expect(page.getByTestId('revenue-compare-a-total')).toHaveText('$200.00');
    await expect(page.getByTestId('revenue-compare-b-total')).toHaveText('$300.00');
  });
});
