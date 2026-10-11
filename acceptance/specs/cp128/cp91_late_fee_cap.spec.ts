import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// UPDATED for cp128 (mutates: [65, 70, 91, 95, 96, 100]): late fees are no longer charged and their
// figures are gone; with no fee there is nothing to cap, so the cap test is replaced by one
// checking that the three overdue invoices carry no fee and owe only their totals.
// No late fee is charged, however large or small the overdue invoice: it owes its total and any
// late interest only.
test.describe('late fee cap', () => {
  test('charges no late fee on an overdue invoice', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-04-30',
      settings: { usdPer: { EUR: 1.1, GBP: 1.25, JPY: 0.0066, CHF: 1.13 } },
      clients: [
        { id: 1, name: 'Acme Ltd', email: 'ops@acme.example' },
        { id: 5, name: 'Helvetia AG', email: 'ap@helvetia.example', currency: 'CHF' },
      ],
      invoices: [
        { id: 1, clientId: 1, status: 'SENT', issueDate: '2026-02-01', dueDate: '2026-03-01',
          lineItems: [{ id: 1, description: 'Design', qty: 1, unitPrice: 100 }] },
        { id: 2, clientId: 1, status: 'SENT', issueDate: '2026-02-01', dueDate: '2026-03-01',
          lineItems: [{ id: 2, description: 'Build', qty: 1, unitPrice: 1000 }] },
        { id: 3, clientId: 5, status: 'SENT', issueDate: '2026-02-01', dueDate: '2026-03-01',
          lineItems: [{ id: 3, description: 'Design', qty: 1, unitPrice: 150 }] },
      ],
    });
    await page.goto('/');

    await page.getByTestId('client-row-1').click();
    await page.getByTestId('invoice-row-1').click();
    await expect(page.getByTestId('invoice-panel-status')).toHaveText('Overdue');
    await expect(page.getByTestId('invoice-late-fee')).toHaveCount(0);
    await expect(page.getByTestId('invoice-amount-due')).toHaveText('$100.00');
    await page.getByTestId('invoice-row-2').click();
    await expect(page.getByTestId('invoice-late-fee')).toHaveCount(0);
    await expect(page.getByTestId('invoice-amount-due')).toHaveText('$1,000.00');
    await page.getByTestId('client-row-5').click();
    await page.getByTestId('invoice-row-3').click();
    await expect(page.getByTestId('invoice-late-fee')).toHaveCount(0);
    await expect(page.getByTestId('invoice-amount-due')).toHaveText('CHF 150.00');
  });
});
