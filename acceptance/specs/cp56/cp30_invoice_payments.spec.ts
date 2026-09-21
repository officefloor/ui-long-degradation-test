import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// CARRIED FORWARD for cp56 (mutates 30): recording a payment on one invoice still works
// alongside the new split-payment allocation.
// Payments can be recorded against an invoice (amount and date) and are shown on the invoice.
test.describe('invoice payments', () => {
  test('shows and records payments on an invoice', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      projects: [{ id: 1, name: 'Website Rebuild', clientId: 1 }],
      invoices: [{ id: 1, projectId: 1, status: 'SENT', lineItems: [{ id: 1, description: 'Work', qty: 1, unitPrice: 100 }] }],
      payments: [{ id: 1, invoiceId: 1, amount: 40, date: '2026-02-01' }],
    });
    await page.goto('/');
    await page.getByTestId('nav-projects').click();
    await page.getByTestId('project-open-1').click();
    await page.getByTestId('invoice-open-1').click();

    await expect(page.getByTestId('invoice-payments-table')).toBeVisible();
    await expect(page.getByTestId('payment-row-1').getByTestId('payment-amount')).toHaveText('$40.00');
    await expect(page.getByTestId('payment-row-1').getByTestId('payment-date')).toHaveText('2026-02-01');

    await page.getByTestId('payment-form-amount').fill('25');
    await page.getByTestId('payment-form-date').fill('2026-02-10');
    await page.getByTestId('payment-form-submit').click();
    await expect(page.getByTestId(/^payment-row-/)).toHaveCount(2);
  });
});
