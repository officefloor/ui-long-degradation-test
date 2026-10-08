import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// Clicking an aging bucket shows the invoices that make it up.
test.describe('aging drilldown', () => {
  test('lists the invoices behind a bucket', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-03-01',
      clients: [{ id: 1, name: 'Acme Ltd', email: 'a@ex.example' }],
      projects: [{ id: 1, name: 'A', clientId: 1 }],
      invoices: [
        { id: 1, projectId: 1, status: 'SENT', dueDate: '2026-01-20', lineItems: [{ id: 1, description: 'x', qty: 1, unitPrice: 200 }] },
        { id: 2, projectId: 1, status: 'SENT', dueDate: '2026-01-25', lineItems: [{ id: 2, description: 'y', qty: 1, unitPrice: 100 }] },
      ],
    });
    await page.goto('/');
    await page.getByTestId('nav-dashboard').click();
    await page.getByTestId('aging-report-open').click();
    await page.getByTestId('aging-bucket-30-60-open').click();

    await expect(page.getByTestId(/^aging-detail-row-/)).toHaveCount(2);
  });
});
