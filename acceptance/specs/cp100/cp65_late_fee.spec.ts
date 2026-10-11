import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// UPDATED for cp100 (mutates: [65, 70, 91, 95, 96]): the late fee is now 2% of what is owed with a
// $10.00 minimum, so the 1,000.00 invoice is charged 20.00 and the CHF 500.00 invoice CHF 10.00
// instead of the flat $25.00. Carries both tests.
// A late fee of 2% of what is owed (at least $10.00, at most 10% of the grand total) is charged
// once on an invoice when it becomes Overdue, if something is still owed then; for a client billed
// in another currency it is converted through US dollars to their currency's step. The panel shows
// the fee charged ($0.00 when none); it is part of the amount due, the balance and the overdue
// amount, earns no interest, and a payment pays it after the invoice itself and before the
// interest. Nothing is charged when the invoice is paid within the week's grace; planned invoices
// are not charged it.
test.describe('late fee', () => {
  test('charges a late fee once an invoice is overdue', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-04-30',
      settings: {
        usdPer: { EUR: 1.1, GBP: 1.25, JPY: 0.0066, CHF: 1.13 },
        lateInterestRate: 12,
        lateFee: 25,
      },
      clients: [
        { id: 1, name: 'Acme Ltd', email: 'ops@acme.example' },
        { id: 5, name: 'Helvetia AG', email: 'ap@helvetia.example', currency: 'CHF' },
      ],
      invoices: [
        { id: 1, clientId: 1, status: 'SENT', issueDate: '2026-02-01', dueDate: '2026-03-01',
          lineItems: [{ id: 1, description: 'Build', qty: 1, unitPrice: 1000 }] },
        { id: 2, clientId: 5, status: 'SENT', issueDate: '2026-02-01', dueDate: '2026-03-01',
          lineItems: [{ id: 2, description: 'Build', qty: 1, unitPrice: 500 }] },
      ],
    });
    await page.goto('/');

    await page.getByTestId('client-row-1').click();
    await page.getByTestId('invoice-row-1').click();
    // overdue since 2026-03-09: 2% of 1,000.00 = 20.00 fee, plus interest on the 1,000.00 only
    await expect(page.getByTestId('invoice-late-fee')).toHaveText('$20.00');
    await expect(page.getByTestId('invoice-interest')).toHaveText('$17.82');
    await expect(page.getByTestId('invoice-amount-due')).toHaveText('$1,037.82');
    // a 30.00 payment pays the invoice first: 30.00 less is owed
    await page.getByTestId('payment-form-amount').fill('30');
    await page.getByTestId('payment-form-date').fill('2026-04-30');
    await page.getByTestId('payment-form-submit').click();
    await expect(page.getByTestId('invoice-amount-due')).toHaveText('$1,007.82');
    await expect(page.getByTestId('invoice-panel-status')).toHaveText('Overdue');

    // 2% of CHF 500.00 = CHF 10.00, more than $10.00 (CHF 8.80)
    await page.getByTestId('client-row-5').click();
    await page.getByTestId('invoice-row-2').click();
    await expect(page.getByTestId('invoice-late-fee')).toHaveText('CHF 10.00');
    await expect(page.getByTestId('invoice-amount-due')).toHaveText('CHF 518.91');
    await expect(page.getByTestId('client-row-5').getByTestId('client-overdue')).toHaveText('CHF 518.91');
  });

  test('charges no fee within the grace week', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-04-30',
      settings: { lateFee: 25 },
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      invoices: [
        { id: 3, clientId: 1, status: 'SENT', issueDate: '2026-03-20', dueDate: '2026-04-20',
          lineItems: [{ id: 1, description: 'Design', qty: 1, unitPrice: 100 }] },
        { id: 4, clientId: 1, status: 'SENT', issueDate: '2026-03-25', dueDate: '2026-04-25',
          lineItems: [{ id: 2, description: 'Design', qty: 1, unitPrice: 100 }] },
      ],
      payments: [
        { id: 1, clientId: 1, amount: 100, date: '2026-04-25', allocations: [{ invoiceId: 3, amount: 100 }] },
      ],
    });
    await page.goto('/');

    await page.getByTestId('client-row-1').click();
    await page.getByTestId('invoice-row-3').click();
    await expect(page.getByTestId('invoice-late-fee')).toHaveText('$0.00');
    await page.getByTestId('invoice-row-4').click();
    await expect(page.getByTestId('invoice-late-fee')).toHaveText('$0.00');
    await expect(page.getByTestId('invoice-amount-due')).toHaveText('$100.00');
  });
});
