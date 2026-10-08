import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// MUTATIVE (revises the multi-currency rule). A foreign invoice's home-currency figure uses the
// exchange rate from the invoice's own date; the per-currency totals stay separate as before. An
// updated copy of the multi-currency spec ships in the sibling override folder. Here a €100 invoice
// dated when the rate was 1.1 converts to $110.
test.describe('convert at invoice date', () => {
  test('uses the invoice-date rate for the home figure', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      homeCurrency: 'USD',
      fxRates: [{ currency: 'EUR', date: '2026-02-01', rate: 1.1 }],
      clients: [{ id: 1, name: 'Globex', email: 'ac@globex.example', currency: 'EUR' }],
      projects: [{ id: 1, name: 'Intranet', clientId: 1 }],
      invoices: [{ id: 1, projectId: 1, status: 'SENT', issueDate: '2026-02-01', lineItems: [{ id: 1, description: 'Work', qty: 1, unitPrice: 100 }] }],
    });
    await page.goto('/');
    await page.getByTestId('nav-projects').click();
    await page.getByTestId('project-open-1').click();
    await page.getByTestId('invoice-open-1').click();

    await expect(page.getByTestId('invoice-amount')).toHaveText('€100.00');
    await expect(page.getByTestId('invoice-home-amount')).toHaveText('$110.00');
  });
});
