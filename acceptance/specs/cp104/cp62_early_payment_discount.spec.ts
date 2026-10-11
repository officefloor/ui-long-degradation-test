import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';
import { auditLines } from '../support/audit';

// UPDATED for cp104 (mutates: [62]): the early discount is now worked out on the amount before tax,
// so the 1,122.33 invoice (1,234.56 with tax) settles early with 22.44 off instead of 24.69.
// Carries all three tests.
// A client can have an early-payment discount (clients[].earlyPayPct and clients[].earlyPayDays,
// set when adding the client). If an invoice of theirs is paid off within that many days of its
// issue date, the early discount (the percentage of the amount before tax, rounded down to the cent)
// comes off: a payment dated within the window that brings what is paid (plus credit notes) up to
// the grand total minus the early discount settles the invoice. It is Paid with nothing due, the
// panel shows the early discount taken ($0.00 otherwise) and EARLY_DISCOUNT id=<invoice id>
// amount=<discount> is written. While the window is open the panel shows the amount that would
// settle it now. Anything paid beyond that is held as credit. Invoices with retention or a plan get
// no early discount.
test.describe('early-payment discount', () => {
  test('settles early for the discounted amount', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-03-05',
      settings: { taxRate: 10 },
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example', earlyPayPct: 2, earlyPayDays: 10 }],
      invoices: [
        { id: 1, clientId: 1, status: 'SENT', issueDate: '2026-03-01', dueDate: '2026-04-30',
          lineItems: [{ id: 1, description: 'Build', qty: 1, unitPrice: 1122.33 }] },
        { id: 2, clientId: 1, status: 'SENT', issueDate: '2026-02-01', dueDate: '2026-03-31',
          lineItems: [{ id: 2, description: 'Design', qty: 1, unitPrice: 500 }] },
      ],
    });
    await page.goto('/');

    await page.getByTestId('client-row-1').click();
    await page.getByTestId('invoice-row-1').click();
    // 1,122.33 + 112.23 tax = 1,234.56; 2% of the 1,122.33 before tax = 22.4466, rounded down to
    // 22.44; issued 2026-03-01,
    // so the 10-day window is open today (2026-03-05)
    await expect(page.getByTestId('invoice-grand-total')).toHaveText('$1,234.56');
    await expect(page.getByTestId('invoice-settle-amount')).toHaveText('$1,212.12');
    await page.getByTestId('payment-form-amount').fill('1212.12');
    await page.getByTestId('payment-form-date').fill('2026-03-05');
    await page.getByTestId('payment-form-submit').click();
    await expect(page.getByTestId('invoice-panel-status')).toHaveText('Paid');
    await expect(page.getByTestId('invoice-amount-due')).toHaveText('$0.00');
    await expect(page.getByTestId('invoice-early-discount')).toHaveText('$22.44');
    await expect.poll(() => auditLines()).toContain('EARLY_DISCOUNT id=1 amount=22.44');
    await expect(page.getByTestId('client-row-1').getByTestId('client-balance')).toHaveText('$550.00'); // invoice 2 only

    // invoice 2's window closed on 2026-02-11: no early amount, the full total is due
    await page.getByTestId('invoice-row-2').click();
    await expect(page.getByTestId('invoice-settle-amount')).toHaveCount(0);
    await page.getByTestId('payment-form-amount').fill('539');
    await page.getByTestId('payment-form-date').fill('2026-03-05');
    await page.getByTestId('payment-form-submit').click();
    await expect(page.getByTestId('invoice-amount-due')).toHaveText('$11.00'); // 550.00 - 539.00
    await expect(page.getByTestId('invoice-panel-status')).toHaveText('Part paid');
    await expect(page.getByTestId('invoice-early-discount')).toHaveText('$0.00');
  });

  test('paying the full amount early leaves the discount as credit', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-03-05',
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example', earlyPayPct: 2, earlyPayDays: 10 }],
      invoices: [
        { id: 3, clientId: 1, status: 'SENT', issueDate: '2026-03-01', dueDate: '2026-04-30',
          lineItems: [{ id: 1, description: 'Design', qty: 1, unitPrice: 300 }] },
        { id: 4, clientId: 1, status: 'SENT', issueDate: '2026-03-01', dueDate: '2026-04-30',
          retentionPct: 10,
          lineItems: [{ id: 2, description: 'Build', qty: 1, unitPrice: 100 }] },
      ],
    });
    await page.goto('/');

    await page.getByTestId('client-row-1').click();
    await page.getByTestId('invoice-row-3').click();
    await page.getByTestId('payment-form-amount').fill('300');
    await page.getByTestId('payment-form-date').fill('2026-03-05');
    await page.getByTestId('payment-form-submit').click();
    // 300.00 - 2% (6.00) = 294.00 settles it; the other 6.00 is held as credit
    await expect(page.getByTestId('invoice-panel-status')).toHaveText('Paid');
    await expect(page.getByTestId('invoice-paid')).toHaveText('$294.00');
    await expect(page.getByTestId('invoice-early-discount')).toHaveText('$6.00');
    await expect.poll(() => auditLines()).toContain('CREDIT_HELD payment=1 amount=6.00');
    await expect(page.getByTestId('client-row-1').getByTestId('client-credit')).toHaveText('$6.00');
    // an invoice holding back retention gets no early discount
    await page.getByTestId('invoice-row-4').click();
    await expect(page.getByTestId('invoice-settle-amount')).toHaveCount(0);
  });

  test('sets early-payment terms when adding a client', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-03-10',
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
    });
    await page.goto('/');

    await page.getByTestId('client-form-name').fill('Initech');
    await page.getByTestId('client-form-email').fill('ap@initech.example');
    await page.getByTestId('client-form-early-pct').fill('2');
    await page.getByTestId('client-form-early-days').fill('10');
    await page.getByTestId('client-form-submit').click();
    await page.getByTestId('client-row-2').click();
    await page.getByTestId('invoice-new').click();
    await page.getByTestId('line-form-description').fill('Design');
    await page.getByTestId('line-form-qty').fill('1');
    await page.getByTestId('line-form-unit-price').fill('100');
    await page.getByTestId('line-form-submit').click();
    await page.getByTestId('invoice-send').click();
    await expect(page.getByTestId('invoice-settle-amount')).toHaveText('$98.00'); // 100.00 - 2%
  });
});
