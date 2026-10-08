import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// Invoices that have had a credit put against them are marked so they can be spotted.
test.describe('credit applied flag', () => {
  test('flags an invoice with a credit', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      projects: [{ id: 1, name: 'Website Rebuild', clientId: 1 }],
      invoices: [
        { id: 1, projectId: 1, status: 'SENT', lineItems: [{ id: 1, description: 'A', qty: 1, unitPrice: 100 }] },
        { id: 2, projectId: 1, status: 'SENT', lineItems: [{ id: 2, description: 'B', qty: 1, unitPrice: 100 }] },
      ],
      creditNotes: [{ id: 1, invoiceId: 1, amount: 20, date: '2026-02-01' }],
    });
    await page.goto('/');
    await page.getByTestId('nav-projects').click();
    await page.getByTestId('project-open-1').click();

    await expect(page.getByTestId('invoice-row-1').getByTestId('invoice-credit-flag')).toBeVisible();
    await expect(page.getByTestId('invoice-row-2').getByTestId('invoice-credit-flag')).toHaveCount(0);
  });
});
