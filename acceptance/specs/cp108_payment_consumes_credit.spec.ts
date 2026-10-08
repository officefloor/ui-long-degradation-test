import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// MUTATIVE (revises the status-with-credits and deposit-allocation rules). One payment can settle
// several invoices, using up any deposit or credit first and leaving any surplus as credit, with
// every balance reconciling. Updated copies of those specs ship in the sibling override folder.
// Here a 50 deposit plus a 120 payment settle two 100 invoices (170 of 200), leaving 30 owing.
test.describe('payment consumes credit', () => {
  test('a deposit then a payment settle invoices and reconcile', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      projects: [{ id: 1, name: 'Website Rebuild', clientId: 1 }],
      invoices: [
        { id: 1, projectId: 1, status: 'SENT', lineItems: [{ id: 1, description: 'A', qty: 1, unitPrice: 100 }] },
        { id: 2, projectId: 1, status: 'SENT', lineItems: [{ id: 2, description: 'B', qty: 1, unitPrice: 100 }] },
      ],
      deposits: [{ id: 1, clientId: 1, amount: 50, date: '2026-01-15' }],
    });
    await page.goto('/');
    await page.getByTestId('nav-clients').click();
    await page.getByTestId('client-open-1').click();
    await page.getByTestId('client-record-payment').click();

    await page.getByTestId('payment-form-amount').fill('120');
    await page.getByTestId('payment-form-date').fill('2026-02-05');
    await page.getByTestId('payment-use-credit').check();
    await page.getByTestId('payment-alloc-1').fill('100');
    await page.getByTestId('payment-alloc-2').fill('70');
    await page.getByTestId('payment-form-submit').click();

    await page.getByTestId('nav-projects').click();
    await page.getByTestId('project-open-1').click();
    await expect(page.getByTestId('invoice-row-1').getByTestId('invoice-due-amount')).toHaveText('$0.00');
    await expect(page.getByTestId('invoice-row-2').getByTestId('invoice-due-amount')).toHaveText('$30.00');
  });
});
