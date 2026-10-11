import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// UPDATED for cp128 (mutates: [65, 70, 91, 95, 96, 100]): late fees are no longer charged and their
// figures are gone; the 2% fee test is replaced by one checking that overdue invoices of 2,000.00,
// 300.00 and 50,000 yen owe only their totals.
// No late fee is charged on an overdue invoice, whatever it owes: the panel shows none and the
// overdue amount is what the invoice itself owes.
test.describe('late fee as a percentage', () => {
  test('charges no late fee, however much is owed', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-04-30',
      settings: { usdPer: { EUR: 1.1, GBP: 1.25, JPY: 0.0066, CHF: 1.13 } },
      clients: [
        { id: 1, name: 'Acme Ltd', email: 'ops@acme.example' },
        { id: 3, name: 'Kaisha KK', email: 'ap@kaisha.example', currency: 'JPY' },
      ],
      invoices: [
        { id: 1, clientId: 1, status: 'SENT', issueDate: '2026-02-01', dueDate: '2026-03-01',
          lineItems: [{ id: 1, description: 'Build', qty: 1, unitPrice: 2000 }] },
        { id: 2, clientId: 1, status: 'SENT', issueDate: '2026-02-01', dueDate: '2026-03-01',
          lineItems: [{ id: 2, description: 'Design', qty: 1, unitPrice: 300 }] },
        { id: 3, clientId: 3, status: 'SENT', issueDate: '2026-02-01', dueDate: '2026-03-01',
          lineItems: [{ id: 3, description: 'Consulting', qty: 1, unitPrice: 50000 }] },
      ],
    });
    await page.goto('/');

    await page.getByTestId('client-row-1').click();
    await page.getByTestId('invoice-row-1').click();
    await expect(page.getByTestId('invoice-late-fee')).toHaveCount(0);
    await expect(page.getByTestId('invoice-amount-due')).toHaveText('$2,000.00');
    await page.getByTestId('invoice-row-2').click();
    await expect(page.getByTestId('invoice-panel-number')).toHaveText(await page.getByTestId('invoice-row-2').getByTestId('invoice-number').innerText());
    await expect(page.getByTestId('invoice-late-fee')).toHaveCount(0);
    await expect(page.getByTestId('invoice-amount-due')).toHaveText('$300.00');
    await page.getByTestId('client-row-3').click();
    await page.getByTestId('invoice-row-3').click();
    await expect(page.getByTestId('invoice-panel-number')).toHaveText(await page.getByTestId('invoice-row-3').getByTestId('invoice-number').innerText());
    await expect(page.getByTestId('invoice-late-fee')).toHaveCount(0);
    await expect(page.getByTestId('client-row-3').getByTestId('client-overdue')).toHaveText('¥50,000');
  });
});
