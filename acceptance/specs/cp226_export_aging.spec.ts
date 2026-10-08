import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// The aging report can be exported to a file.
test.describe('export aging', () => {
  test('confirms the aging export', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-03-01',
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      projects: [{ id: 1, name: 'A', clientId: 1 }],
      invoices: [{ id: 1, projectId: 1, status: 'SENT', dueDate: '2026-01-20', lineItems: [{ id: 1, description: 'x', qty: 1, unitPrice: 200 }] }],
    });
    await page.goto('/');
    await page.getByTestId('nav-dashboard').click();
    await page.getByTestId('aging-report-open').click();
    await page.getByTestId('aging-export').click();
    await expect(page.getByTestId('export-confirm')).toBeVisible();
  });
});
