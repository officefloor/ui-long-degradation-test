import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// A revenue report for a date range totals the invoices issued within it (billed basis by default).
test.describe('revenue report', () => {
  test('totals revenue billed within a date range', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      projects: [{ id: 1, name: 'Website Rebuild', clientId: 1 }],
      invoices: [
        { id: 1, projectId: 1, status: 'SENT', issueDate: '2026-02-05', lineItems: [{ id: 1, description: 'A', qty: 1, unitPrice: 100 }] },
        { id: 2, projectId: 1, status: 'SENT', issueDate: '2026-02-20', lineItems: [{ id: 2, description: 'B', qty: 1, unitPrice: 200 }] },
        { id: 3, projectId: 1, status: 'SENT', issueDate: '2026-04-01', lineItems: [{ id: 3, description: 'C', qty: 1, unitPrice: 500 }] },
      ],
    });
    await page.goto('/');
    await page.getByTestId('nav-dashboard').click();
    await page.getByTestId('revenue-report-open').click();
    await page.getByTestId('revenue-report-from').fill('2026-02-01');
    await page.getByTestId('revenue-report-to').fill('2026-02-28');
    await page.getByTestId('revenue-report-apply').click();

    await expect(page.getByTestId('revenue-report-total')).toHaveText('$300.00');
  });
});
