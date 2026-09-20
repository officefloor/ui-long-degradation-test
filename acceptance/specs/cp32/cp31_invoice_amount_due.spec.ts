import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../../support/seed';

// UPDATED (status derived from payments): the amount still due is unchanged (amount minus payments),
// and a partly-paid invoice now reads PARTIAL.
test.describe('invoice amount due', () => {
  test('shows the amount due and a partial status when part paid', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      projects: [{ id: 1, name: 'Website Rebuild', clientId: 1 }],
      invoices: [{ id: 1, projectId: 1, status: 'SENT', lineItems: [{ id: 1, description: 'Work', qty: 1, unitPrice: 100 }] }],
      payments: [{ id: 1, invoiceId: 1, amount: 40, date: '2026-02-01' }],
    });
    await page.goto('/');
    await page.getByTestId('nav-projects').click();
    await page.getByTestId('project-open-1').click();

    await expect(page.getByTestId('invoice-row-1').getByTestId('invoice-due-amount')).toHaveText('$60.00');
    await expect(page.getByTestId('invoice-row-1').getByTestId('invoice-status')).toHaveText('PARTIAL');
  });
});
