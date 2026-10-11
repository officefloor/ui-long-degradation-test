import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// A foreign-currency invoice shows its home-currency equivalent, converted at the rate for the
// invoice's own date. When there is no rate for that exact date, the most recent earlier rate is
// used, and the invoice shows which date's rate it used.
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

  test('uses the most recent earlier rate and says which', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      fxRates: [
        { currency: 'EUR', date: '2026-01-15', rate: 1.05 },
        { currency: 'EUR', date: '2026-02-10', rate: 1.20 },
      ],
      clients: [{ id: 1, name: 'Globex', email: 'ac@globex.example', currency: 'EUR' }],
      projects: [{ id: 1, name: 'Intranet', clientId: 1 }],
      invoices: [{ id: 1, projectId: 1, status: 'SENT', issueDate: '2026-02-01', lineItems: [{ id: 1, description: 'Work', qty: 1, unitPrice: 100 }] }],
    });
    await page.goto('/');
    await page.getByTestId('nav-projects').click();
    await page.getByTestId('project-open-1').click();
    await page.getByTestId('invoice-open-1').click();

    // No rate on 2026-02-01: the 2026-01-15 rate applies (a nearest-date choice would use 1.20).
    await expect(page.getByTestId('invoice-home-amount')).toHaveText('$105.00');
    await expect(page.getByTestId('invoice-rate-date')).toHaveText('2026-01-15');
  });
});
