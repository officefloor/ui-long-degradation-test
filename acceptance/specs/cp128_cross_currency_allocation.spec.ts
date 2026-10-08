import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// MUTATIVE (revises payment allocation). One payment can be split across invoices in different
// currencies; each share is converted at the payment's date so every invoice's balance is right in
// its own currency.
test.describe('cross-currency allocation', () => {
  test('splits a payment across invoices in two currencies', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      fxRates: [{ currency: 'EUR', date: '2026-02-05', rate: 1.00 }],
      clients: [{ id: 1, name: 'Globex', email: 'ac@globex.example', currency: 'USD' }],
      projects: [{ id: 1, name: 'Intranet', clientId: 1 }],
      invoices: [
        { id: 1, projectId: 1, status: 'SENT', currency: 'USD', lineItems: [{ id: 1, description: 'A', qty: 1, unitPrice: 100 }] },
        { id: 2, projectId: 1, status: 'SENT', currency: 'EUR', lineItems: [{ id: 2, description: 'B', qty: 1, unitPrice: 100 }] },
      ],
    });
    await page.goto('/');
    await page.getByTestId('nav-clients').click();
    await page.getByTestId('client-open-1').click();
    await page.getByTestId('client-record-payment').click();

    await page.getByTestId('payment-form-amount').fill('150');
    await page.getByTestId('payment-form-date').fill('2026-02-05');
    await page.getByTestId('payment-alloc-1').fill('100');
    await page.getByTestId('payment-alloc-2').fill('50');
    await page.getByTestId('payment-form-submit').click();

    await page.getByTestId('nav-projects').click();
    await page.getByTestId('project-open-1').click();
    await expect(page.getByTestId('invoice-row-1').getByTestId('invoice-due-amount')).toHaveText('$0.00');
    await expect(page.getByTestId('invoice-row-2').getByTestId('invoice-due-amount')).toHaveText('€50.00');
  });
});
