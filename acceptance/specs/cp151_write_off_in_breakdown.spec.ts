import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// A write-off appears as its own line in the invoice breakdown.
test.describe('write-off in breakdown', () => {
  test('shows the write-off as a breakdown line', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      projects: [{ id: 1, name: 'Website Rebuild', clientId: 1 }],
      invoices: [{ id: 1, projectId: 1, status: 'SENT', writeOff: 40, lineItems: [{ id: 1, description: 'Work', qty: 1, unitPrice: 100 }] }],
    });
    await page.goto('/');
    await page.getByTestId('nav-projects').click();
    await page.getByTestId('project-open-1').click();
    await page.getByTestId('invoice-open-1').click();

    await expect(page.getByTestId('breakdown-writeoff-row').getByTestId('breakdown-writeoff-amount')).toHaveText('$40.00');
  });
});
