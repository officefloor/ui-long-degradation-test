import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';
import { auditLines } from '../support/audit';

// Sending a reminder can charge a fee (settings.reminderFees: an amount in US dollars per level,
// converted to the client's currency at that day's rate and rounded down), written as REMINDER_FEE
// id=<id> amount=<fee> and shown on the panel as the reminder fees charged. A fee is owed with the
// invoice: it is in the amount due, the balance, the overdue amount and the cash due, earns no
// interest and takes no tax. A payment pays the invoice first, then its reminder fees, then its
// late interest. Waiving interest leaves the fees owed; writing the invoice off includes them. A
// seeded reminder (invoices[].reminders) went out on its date, so it carries its level's fee from
// that day, as one sent through the panel does.
test.describe('reminder fees', () => {
  test('later reminders charge a fee, owed after the invoice and before its interest', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-06-10',
      settings: {
        taxRate: 10,
        lateInterestRate: 12,
        reminderFees: { REMINDER_2: 15, FINAL: 40 },
        usdPer: { EUR: 1.1, GBP: 1.25, JPY: 0.0066, CHF: 1.13 },
      },
      clients: [
        { id: 1, name: 'Acme Ltd', email: 'ops@acme.example' },
        { id: 2, name: 'Globex Corp', email: 'billing@globex.example', currency: 'EUR' },
      ],
      invoices: [
        { id: 1, clientId: 1, status: 'SENT', issueDate: '2026-04-10', dueDate: '2026-05-10',
          reminders: ['2026-05-20'],
          lineItems: [{ id: 1, description: 'Design', qty: 1, unitPrice: 1000 }] },
        { id: 2, clientId: 2, status: 'SENT', issueDate: '2026-03-01', dueDate: '2026-04-01',
          reminders: ['2026-04-10', '2026-05-01'],
          lineItems: [{ id: 2, description: 'Audit', qty: 1, unitPrice: 400 }] },
      ],
    });
    await page.goto('/');

    await page.getByTestId('client-row-1').click();
    await page.getByTestId('invoice-row-1').click();
    await expect(page.getByTestId('invoice-amount-due')).toHaveText('$1,108.83'); // 1,100.00 + interest
    await page.getByTestId('invoice-remind').click();
    await expect.poll(() => auditLines()).toContain('REMINDER_FEE id=1 amount=15.00');
    await expect(page.getByTestId('invoice-reminder-fees')).toHaveText('$15.00');
    await expect(page.getByTestId('invoice-amount-due')).toHaveText('$1,123.83');
    // 1,110.00 pays the invoice's 1,100.00, then 10.00 of the fee; the rest of the fee and the
    // interest are still owed
    await page.getByTestId('payment-form-amount').fill('1110');
    await page.getByTestId('payment-form-date').fill('2026-06-10');
    await page.getByTestId('payment-form-submit').click();
    await expect(page.getByTestId('invoice-amount-due')).toHaveText('$13.83');
    await expect(page.getByTestId('invoice-panel-status')).toHaveText('Overdue');
    await expect(page.getByTestId('invoice-cash-due')).toHaveText('$13.80');
    // a final notice to a client in euros: 40.00 US dollars / 1.10 = 36.3636, down to 36.36, on top of
    // the second reminder's 15.00 / 1.10 = 13.63
    await page.getByTestId('client-row-2').click();
    await page.getByTestId('invoice-row-2').click();
    await expect(page.getByTestId('invoice-panel-number')).toHaveText(await page.getByTestId('invoice-row-2').getByTestId('invoice-number').innerText());
    await page.getByTestId('invoice-remind').click();
    await expect.poll(() => auditLines()).toContain('REMINDER_FEE id=2 amount=36.36');
    await expect(page.getByTestId('invoice-reminder-fees')).toHaveText('€49.99');
    await expect(page.getByTestId('client-row-2').getByTestId('client-balance')).toHaveText('€499.28');
  });
});
