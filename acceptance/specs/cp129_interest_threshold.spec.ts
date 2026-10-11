import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// Late interest on an invoice (without a plan) is only charged once its total reaches the workspace
// threshold (settings.interestThreshold, in US dollars converted at the issue date's rate, rounded
// down). Below it the invoice shows no interest and none is owed: a payment of what the invoice
// itself owes settles it. From the threshold on, all of its interest is owed as usual.
test.describe('late interest threshold', () => {
  test('charges no late interest until it reaches the threshold', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-04-30',
      settings: {
        usdPer: { EUR: 1.1, GBP: 1.25, JPY: 0.0066, CHF: 1.13 },
        lateInterestRate: 12,
        interestThreshold: 5,
      },
      clients: [
        { id: 1, name: 'Acme Ltd', email: 'ops@acme.example' },
        { id: 3, name: 'Kaisha KK', email: 'ap@kaisha.example', currency: 'JPY' },
      ],
      invoices: [
        { id: 1, clientId: 1, status: 'SENT', issueDate: '2026-02-01', dueDate: '2026-03-01',
          lineItems: [{ id: 1, description: 'Build', qty: 1, unitPrice: 1000 }] },
        { id: 2, clientId: 1, status: 'SENT', issueDate: '2026-03-01', dueDate: '2026-04-01',
          lineItems: [{ id: 2, description: 'Design', qty: 1, unitPrice: 200 }] },
        { id: 3, clientId: 3, status: 'SENT', issueDate: '2026-02-15', dueDate: '2026-03-15',
          lineItems: [{ id: 3, description: 'Consulting', qty: 1, unitPrice: 50000 }] },
      ],
    });
    await page.goto('/');

    await page.getByTestId('client-row-1').click();
    await page.getByTestId('invoice-row-1').click();
    // 17.82 of interest is over the 5.00 threshold: all of it is owed
    await expect(page.getByTestId('invoice-interest')).toHaveText('$17.82');
    await expect(page.getByTestId('invoice-amount-due')).toHaveText('$1,017.82');
    // 22 days on 200.00 from 2026-04-08 is 1.47, under 5.00: nothing is charged yet
    await page.getByTestId('invoice-row-2').click();
    await expect(page.getByTestId('invoice-panel-number')).toHaveText(await page.getByTestId('invoice-row-2').getByTestId('invoice-number').innerText());
    await expect(page.getByTestId('invoice-panel-status')).toHaveText('Overdue');
    await expect(page.getByTestId('invoice-interest')).toHaveText('$0.00');
    await expect(page.getByTestId('invoice-amount-due')).toHaveText('$200.00');
    await expect(page.getByTestId('client-row-1').getByTestId('client-overdue')).toHaveText('$1,217.82');
    // paying the 200.00 clears it: the interest under the threshold is never collected
    await page.getByTestId('payment-form-amount').fill('200');
    await page.getByTestId('payment-form-date').fill('2026-04-30');
    await page.getByTestId('payment-form-submit').click();
    await expect(page.getByTestId('invoice-panel-status')).toHaveText('Paid late');
    await expect(page.getByTestId('invoice-amount-due')).toHaveText('$0.00');
    // in yen the threshold is 5 / 0.0066 = 757.57, down to 757; 39 days on 50,000 is 652 yen
    await page.getByTestId('client-row-3').click();
    await page.getByTestId('invoice-row-3').click();
    await expect(page.getByTestId('invoice-panel-number')).toHaveText(await page.getByTestId('invoice-row-3').getByTestId('invoice-number').innerText());
    await expect(page.getByTestId('invoice-interest')).toHaveText('¥0');
    await expect(page.getByTestId('invoice-amount-due')).toHaveText('¥50,000');
  });
});
