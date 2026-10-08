import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// Several part payments can be recorded against one invoice over time, and the remaining balance is
// always correct.
test.describe('multiple partial payments', () => {
  test('tracks the balance across several part payments', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      projects: [{ id: 1, name: 'Website Rebuild', clientId: 1 }],
      invoices: [{ id: 1, projectId: 1, status: 'SENT', lineItems: [{ id: 1, description: 'Work', qty: 1, unitPrice: 300 }] }],
      payments: [
        { id: 1, invoiceId: 1, amount: 100, date: '2026-02-01' },
        { id: 2, invoiceId: 1, amount: 120, date: '2026-02-10' },
      ],
    });
    await page.goto('/');
    await page.getByTestId('nav-projects').click();
    await page.getByTestId('project-open-1').click();

    await expect(page.getByTestId('invoice-row-1').getByTestId('invoice-due-amount')).toHaveText('$80.00');
    await expect(page.getByTestId('invoice-row-1').getByTestId('invoice-status')).toHaveText('PARTIAL');
  });
});
