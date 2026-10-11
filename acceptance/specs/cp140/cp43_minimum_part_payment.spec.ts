import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// UPDATED for cp140 (mutates: [40, 43, 61, 92]): a small balance is now written off only when it is
// worth less than $0.05 (and at most 1% of the total); the 9.50 paid against 10.00 due no longer
// settles invoice 3 by writing off 0.50; it is a part payment (at least a tenth of what is due)
// leaving 0.50 due. Carries all three tests.
// A part payment on an invoice must be at least 10% of its amount due, unless it settles the
// invoice (including leaving less than $0.05, which is written off). This applies to a payment
// against the open invoice and to a payment by reference;
// otherwise it is refused with an error.
test.describe('minimum part payment', () => {
  test('a part payment must be at least a tenth of the total', { tag: '@error' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-03-10',
      settings: { taxRate: 10 },
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      invoices: [
        { id: 1, clientId: 1, status: 'SENT', issueDate: '2026-03-01', dueDate: '2026-04-30',
          lineItems: [{ id: 1, description: 'Design', qty: 1, unitPrice: 200 }] },
      ],
    });
    await page.goto('/');

    await page.getByTestId('client-row-1').click();
    await page.getByTestId('invoice-row-1').click();
    await expect(page.getByTestId('invoice-grand-total')).toHaveText('$220.00'); // 200.00 + 20.00 tax
    // nothing paid yet: 10% of the 220.00 due = 22.00
    await page.getByTestId('payment-form-amount').fill('21.99');
    await page.getByTestId('payment-form-date').fill('2026-03-09');
    await page.getByTestId('payment-form-submit').click();
    await expect(page.getByTestId('payment-form-error')).toBeVisible();
    await expect(page.getByTestId('invoice-paid')).toHaveText('$0.00');
    await page.getByTestId('payment-form-amount').fill('22');
    await page.getByTestId('payment-form-submit').click();
    await expect(page.getByTestId('invoice-paid')).toHaveText('$22.00');
    await expect(page.getByTestId('invoice-amount-due')).toHaveText('$198.00'); // 220.00 - 22.00
    await expect(page.getByTestId('invoice-panel-status')).toHaveText('Part paid');
  });

  test('a smaller payment that settles the invoice is accepted', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-03-10',
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      invoices: [
        { id: 2, clientId: 1, status: 'SENT', issueDate: '2026-03-01', dueDate: '2026-04-30',
          lineItems: [{ id: 1, description: 'Design', qty: 1, unitPrice: 100 }] },
        { id: 3, clientId: 1, status: 'SENT', issueDate: '2026-03-01', dueDate: '2026-04-30',
          lineItems: [{ id: 2, description: 'Hosting', qty: 1, unitPrice: 100 }] },
      ],
      payments: [
        { id: 1, clientId: 1, amount: 95, date: '2026-03-02', allocations: [{ invoiceId: 2, amount: 95 }] },
        { id: 2, clientId: 1, amount: 90, date: '2026-03-02', allocations: [{ invoiceId: 3, amount: 90 }] },
      ],
    });
    await page.goto('/');

    await page.getByTestId('client-row-1').click();
    await page.getByTestId('invoice-row-2').click();
    await expect(page.getByTestId('invoice-amount-due')).toHaveText('$5.00'); // 100.00 - 95.00
    await page.getByTestId('payment-form-amount').fill('5');
    await page.getByTestId('payment-form-date').fill('2026-03-09');
    await page.getByTestId('payment-form-submit').click();
    await expect(page.getByTestId('invoice-amount-due')).toHaveText('$0.00');
    await expect(page.getByTestId('invoice-panel-status')).toHaveText('Paid');

    await page.getByTestId('invoice-row-3').click();
    await expect(page.getByTestId('invoice-panel-number')).toHaveText(await page.getByTestId('invoice-row-3').getByTestId('invoice-number').innerText());
    await expect(page.getByTestId('invoice-amount-due')).toHaveText('$10.00'); // 100.00 - 90.00
    // 9.50 is at least a tenth of the 10.00 due; it leaves 0.50, which is too much to write off
    await page.getByTestId('payment-form-amount').fill('9.50');
    await page.getByTestId('payment-form-date').fill('2026-03-09');
    await page.getByTestId('payment-form-submit').click();
    await expect(page.getByTestId('invoice-written-off')).toHaveText('$0.00');
    await expect(page.getByTestId('invoice-amount-due')).toHaveText('$0.50');
    await expect(page.getByTestId('invoice-panel-status')).toHaveText('Part paid');
  });

  test('a part payment must be a tenth of what is still due', { tag: '@error' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-03-10',
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      invoices: [
        { id: 4, clientId: 1, status: 'SENT', issueDate: '2026-03-01', dueDate: '2026-04-30',
          lineItems: [{ id: 1, description: 'Design', qty: 1, unitPrice: 200 }] },
      ],
      payments: [
        { id: 1, clientId: 1, amount: 150, date: '2026-03-02', allocations: [{ invoiceId: 4, amount: 150 }] },
      ],
    });
    await page.goto('/');

    await page.getByTestId('client-row-1').click();
    await page.getByTestId('invoice-row-4').click();
    // 50.00 is still due, so the minimum is 5.00 (a tenth of the 200.00 total would be 20.00)
    await page.getByTestId('payment-form-amount').fill('4.99');
    await page.getByTestId('payment-form-date').fill('2026-03-09');
    await page.getByTestId('payment-form-submit').click();
    await expect(page.getByTestId('payment-form-error')).toBeVisible();
    await page.getByTestId('payment-form-amount').fill('5');
    await page.getByTestId('payment-form-submit').click();
    await expect(page.getByTestId('invoice-amount-due')).toHaveText('$45.00');
    await expect(page.getByTestId('invoice-panel-status')).toHaveText('Part paid');
  });
});
