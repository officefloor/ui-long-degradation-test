import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// A late fee is never more than 10% of the invoice's grand total, rounded down to the cent: a
// larger fee is capped at that.
test.describe('late fee cap', () => {
  test('never charges a late fee of more than a tenth of the invoice', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-04-30',
      settings: { usdPer: { EUR: 1.1, GBP: 1.25, JPY: 0.0066, CHF: 1.13 }, lateFee: 25 },
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
    // the $25.00 fee is more than 10% of 100.00: capped at 10.00
    await expect(page.getByTestId('invoice-late-fee')).toHaveText('$10.00');
    await page.getByTestId('invoice-row-2').click();
    await expect(page.getByTestId('invoice-late-fee')).toHaveText('$25.00'); // under 10% of 1,000.00
    await page.getByTestId('client-row-5').click();
    await page.getByTestId('invoice-row-3').click();
    // CHF 22.10 against 10% of CHF 150.00 = 15.00
    await expect(page.getByTestId('invoice-late-fee')).toHaveText('CHF 15.00');
    await expect(page.getByTestId('invoice-amount-due')).toHaveText('CHF 165.00');
  });
});
