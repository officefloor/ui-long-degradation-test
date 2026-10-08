import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// The revenue report can be exported to a file.
test.describe('export revenue', () => {
  test('confirms the revenue export', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      projects: [{ id: 1, name: 'A', clientId: 1 }],
      invoices: [{ id: 1, projectId: 1, status: 'SENT', issueDate: '2026-02-05', lineItems: [{ id: 1, description: 'x', qty: 1, unitPrice: 300 }] }],
    });
    await page.goto('/');
    await page.getByTestId('nav-dashboard').click();
    await page.getByTestId('revenue-report-open').click();
    await page.getByTestId('revenue-export').click();
    await expect(page.getByTestId('export-confirm')).toBeVisible();
  });
});
