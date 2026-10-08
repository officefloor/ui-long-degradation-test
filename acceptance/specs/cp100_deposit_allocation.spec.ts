import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// MUTATIVE (revises the payment-allocation rule). A client's deposit can be put toward their
// invoices the same way a payment is split, and each invoice's balance drops by its share. An
// updated copy of the allocation spec ships in the sibling override folder.
test.describe('deposit allocation', () => {
  test('allocates a deposit across invoices', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      projects: [{ id: 1, name: 'Website Rebuild', clientId: 1 }],
      invoices: [
        { id: 1, projectId: 1, status: 'SENT', lineItems: [{ id: 1, description: 'A', qty: 1, unitPrice: 100 }] },
        { id: 2, projectId: 1, status: 'SENT', lineItems: [{ id: 2, description: 'B', qty: 1, unitPrice: 100 }] },
      ],
      deposits: [{ id: 1, clientId: 1, amount: 150, date: '2026-01-15' }],
    });
    await page.goto('/');
    await page.getByTestId('nav-clients').click();
    await page.getByTestId('client-open-1').click();
    await page.getByTestId('client-allocate-deposit').click();

    await page.getByTestId('payment-alloc-1').fill('100');
    await page.getByTestId('payment-alloc-2').fill('50');
    await page.getByTestId('payment-form-submit').click();

    await page.getByTestId('nav-projects').click();
    await page.getByTestId('project-open-1').click();
    await expect(page.getByTestId('invoice-row-1').getByTestId('invoice-due-amount')).toHaveText('$0.00');
    await expect(page.getByTestId('invoice-row-2').getByTestId('invoice-due-amount')).toHaveText('$50.00');
  });
});
