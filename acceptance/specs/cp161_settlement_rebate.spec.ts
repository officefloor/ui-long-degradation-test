import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// A settlement rebate rewards paying before the due date: the invoice shows the rebate that would
// apply.
test.describe('settlement rebate', () => {
  test('shows the settlement rebate offered', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      projects: [{ id: 1, name: 'Website Rebuild', clientId: 1 }],
      invoices: [{ id: 1, projectId: 1, status: 'SENT', rebatePct: 2, dueDate: '2026-03-01',
        lineItems: [{ id: 1, description: 'Work', qty: 1, unitPrice: 500 }] }],
    });
    await page.goto('/');
    await page.getByTestId('nav-projects').click();
    await page.getByTestId('project-open-1').click();
    await page.getByTestId('invoice-open-1').click();

    await expect(page.getByTestId('invoice-rebate')).toHaveText('$10.00'); // 2% of 500
  });
});
