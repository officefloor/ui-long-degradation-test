import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// A foreign-currency invoice shows its home-currency equivalent, converted at the rate for the
// invoice's own date.
test.describe('invoice converted to home currency', () => {
  test('converts at the invoice date rate', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      fxRates: [{ currency: 'EUR', date: '2026-02-01', rate: 1.10 }],
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
