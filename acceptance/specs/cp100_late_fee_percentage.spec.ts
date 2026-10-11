import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// The late fee is now 2% of what is owed when it is charged (the invoice's or instalment's unpaid
// amount, before late charges), rounded down to the cent, but at least $10.00 converted to the
// client's currency, and still never more than 10% of the invoice's grand total (or the
// instalment).
test.describe('late fee as a percentage', () => {
  test('charges 2% of what is owed, at least $10.00', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-04-30',
      settings: { usdPer: { EUR: 1.1, GBP: 1.25, JPY: 0.0066, CHF: 1.13 }, lateFee: 25 },
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
    await expect(page.getByTestId('invoice-late-fee')).toHaveText('$40.00'); // 2% of 2,000.00
    await page.getByTestId('invoice-row-2').click();
    await expect(page.getByTestId('invoice-late-fee')).toHaveText('$10.00'); // 2% of 300.00 = 6.00, at least 10.00
    await expect(page.getByTestId('invoice-amount-due')).toHaveText('$310.00');
    // 2% of 50,000 yen is 1,000; $10.00 is 10 / 0.0066 = 1,515.15, down to 1,515 yen
    await page.getByTestId('client-row-3').click();
    await page.getByTestId('invoice-row-3').click();
    await expect(page.getByTestId('invoice-late-fee')).toHaveText('¥1,515');
    await expect(page.getByTestId('client-row-3').getByTestId('client-overdue')).toHaveText('¥51,515');
  });
});
