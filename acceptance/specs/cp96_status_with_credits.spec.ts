import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// MUTATIVE (revises the derived-status and payment-allocation rules). An invoice's status is worked
// out from its payments AND its credit notes: if a credit clears what is left, it is settled rather
// than still owing. Updated copies of the status and allocation specs ship in the sibling override
// folder. Here 100 with a 40 payment and a 60 credit is fully settled.
test.describe('status accounts for credits', () => {
  test('a credit that clears the balance settles the invoice', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      projects: [{ id: 1, name: 'Website Rebuild', clientId: 1 }],
      invoices: [{ id: 1, projectId: 1, status: 'SENT', lineItems: [{ id: 1, description: 'Work', qty: 1, unitPrice: 100 }] }],
      payments: [{ id: 1, invoiceId: 1, amount: 40, date: '2026-02-01' }],
      creditNotes: [{ id: 1, invoiceId: 1, amount: 60, date: '2026-02-02' }],
    });
    await page.goto('/');
    await page.getByTestId('nav-projects').click();
    await page.getByTestId('project-open-1').click();

    await expect(page.getByTestId('invoice-row-1').getByTestId('invoice-due-amount')).toHaveText('$0.00');
    await expect(page.getByTestId('invoice-row-1').getByTestId('invoice-status')).toHaveText('PAID');
  });
});
