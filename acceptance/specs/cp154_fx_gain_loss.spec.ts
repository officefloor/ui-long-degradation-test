import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// When a foreign payment settles an invoice, the gain or loss from the rate moving between the
// invoice date and the payment date is shown.
test.describe('fx gain/loss', () => {
  test('shows the loss when the rate falls', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      fxRates: [
        { currency: 'EUR', date: '2026-02-01', rate: 1.10 },
        { currency: 'EUR', date: '2026-03-01', rate: 1.00 },
      ],
      clients: [{ id: 1, name: 'Globex', email: 'ac@globex.example', currency: 'EUR' }],
      projects: [{ id: 1, name: 'Intranet', clientId: 1 }],
      invoices: [{ id: 1, projectId: 1, status: 'SENT', issueDate: '2026-02-01', lineItems: [{ id: 1, description: 'Work', qty: 1, unitPrice: 100 }] }],
      payments: [{ id: 1, invoiceId: 1, amount: 100, date: '2026-03-01' }],
    });
    await page.goto('/');
    await page.getByTestId('nav-projects').click();
    await page.getByTestId('project-open-1').click();
    await page.getByTestId('invoice-open-1').click();

    // home value at issue $110 vs at payment $100 -> $10 loss
    await expect(page.getByTestId('invoice-fx-gain-loss')).toHaveText('-$10.00');
  });
});
