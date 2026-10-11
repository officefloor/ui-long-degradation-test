import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// UPDATED for cp68 (mutates: [63, 65, 66]): late interest now runs from the end of the grace week,
// so the overdue invoices earn 53 days of interest instead of 60 and the amounts due change with
// it; the fees are unchanged. Carries both tests.
// A fixed late fee (settings.lateFee, in US dollars) is charged once on an invoice when it becomes
// Overdue, if something is still owed then; for a client billed in another currency it is converted
// through US dollars to their currency's step. The panel shows the fee charged ($0.00 when none);
// it is part of the amount due, the balance and the overdue amount, earns no interest, and a
// payment pays it first, before interest and the invoice. Nothing is charged when the invoice is
// paid within the week's grace; planned invoices are not charged it.
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
    // overdue since 2026-03-09: a 25.00 fee, plus interest on the 1,000.00 only
    await expect(page.getByTestId('invoice-late-fee')).toHaveText('$25.00');
    await expect(page.getByTestId('invoice-interest')).toHaveText('$17.57');
    await expect(page.getByTestId('invoice-amount-due')).toHaveText('$1,042.57');
    // a 125.00 payment (at least the 10% minimum) pays the fee first, then the interest, then the invoice
    await page.getByTestId('payment-form-amount').fill('125');
    await page.getByTestId('payment-form-date').fill('2026-04-30');
    await page.getByTestId('payment-form-submit').click();
    await expect(page.getByTestId('invoice-amount-due')).toHaveText('$917.57');
    await expect(page.getByTestId('invoice-panel-status')).toHaveText('Overdue');

    // for a franc client the $25.00 fee is converted: 25 / 1.13 = 22.12 -> CHF 22.10
    await page.getByTestId('client-row-5').click();
    await page.getByTestId('invoice-row-2').click();
    await expect(page.getByTestId('invoice-panel-number')).toHaveText(await page.getByTestId('invoice-row-2').getByTestId('invoice-number').innerText());
    await expect(page.getByTestId('invoice-late-fee')).toHaveText('CHF 22.10');
    await expect(page.getByTestId('invoice-amount-due')).toHaveText('CHF 530.89');
    await expect(page.getByTestId('client-row-5').getByTestId('client-overdue')).toHaveText('CHF 530.89');
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
    await expect(page.getByTestId('invoice-panel-number')).toHaveText(await page.getByTestId('invoice-row-4').getByTestId('invoice-number').innerText());
    await expect(page.getByTestId('invoice-late-fee')).toHaveText('$0.00');
    await expect(page.getByTestId('invoice-amount-due')).toHaveText('$100.00');
  });
});
