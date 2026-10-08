import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// Revenue shown month by month.
test.describe('revenue trend', () => {
  test('shows revenue per month', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      projects: [{ id: 1, name: 'Website Rebuild', clientId: 1 }],
      invoices: [
        { id: 1, projectId: 1, status: 'SENT', issueDate: '2026-02-10', lineItems: [{ id: 1, description: 'A', qty: 1, unitPrice: 300 }] },
        { id: 2, projectId: 1, status: 'SENT', issueDate: '2026-03-10', lineItems: [{ id: 2, description: 'B', qty: 1, unitPrice: 150 }] },
      ],
    });
    await page.goto('/');
    await page.getByTestId('nav-dashboard').click();
    await page.getByTestId('revenue-report-open').click();

    await expect(page.getByTestId('revenue-month-row-2026-02').getByTestId('revenue-month-amount')).toHaveText('$300.00');
    await expect(page.getByTestId('revenue-month-row-2026-03').getByTestId('revenue-month-amount')).toHaveText('$150.00');
  });
});
