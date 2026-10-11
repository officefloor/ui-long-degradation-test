import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';
import { auditLines } from '../support/audit';

// A payment can be taken in cash (payments[].method 'CASH'; the payment form's method, BANK by
// default). The panel shows what is due in cash: the amount due rounded half up to the nearest 0.05
// (invoice-cash-due), and the difference (invoice-cash-rounding, signed). A cash payment of exactly
// the cash amount due settles the invoice: it is Paid with nothing due, the difference is the cash
// rounding (CASH_ROUNDING id=<invoice id> amount=<signed difference>), never credit or a balance
// left owing, and the rounding stays shown. Cash must be a multiple of 0.05 (whole yen for yen
// clients), in the client's own currency, and taken against the open invoice; otherwise it is
// refused. Yen need no rounding.
test.describe('cash payments', () => {
  test('settles an invoice in cash to the nearest five cents', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-03-10',
      settings: { taxRate: 10, usdPer: { EUR: 1.1, GBP: 1.25, JPY: 0.0066, CHF: 1.13 } },
      clients: [
        { id: 1, name: 'Acme Ltd', email: 'ops@acme.example' },
        { id: 2, name: 'Globex Corp', email: 'billing@globex.example', currency: 'EUR' },
      ],
      invoices: [
        { id: 1, clientId: 1, status: 'SENT', issueDate: '2026-03-01', dueDate: '2026-04-30',
          lineItems: [{ id: 1, description: 'Beans', qty: 1, unitPrice: 11.25 }] },
        { id: 2, clientId: 1, status: 'SENT', issueDate: '2026-03-01', dueDate: '2026-04-30',
          lineItems: [{ id: 2, description: 'Beans', qty: 1, unitPrice: 11.24 }] },
        { id: 3, clientId: 2, status: 'SENT', issueDate: '2026-03-01', dueDate: '2026-04-30',
          lineItems: [{ id: 3, description: 'Beans', qty: 1, unitPrice: 11.25 }] },
      ],
    });
    await page.goto('/');

    await page.getByTestId('client-row-1').click();
    await page.getByTestId('invoice-row-1').click();
    // 11.25 + 1.13 tax = 12.38: in cash, to the nearest 0.05 is 12.40, 0.02 more
    await expect(page.getByTestId('invoice-cash-due')).toHaveText('$12.40');
    await expect(page.getByTestId('invoice-cash-rounding')).toHaveText('$0.02');
    await page.getByTestId('payment-form-method').selectOption('CASH');
    await page.getByTestId('payment-form-amount').fill('12.40');
    await page.getByTestId('payment-form-date').fill('2026-03-10');
    await page.getByTestId('payment-form-submit').click();
    // the 12.40 settles it; the extra 0.02 is the cash rounding, not credit
    await expect(page.getByTestId('invoice-panel-status')).toHaveText('Paid');
    await expect(page.getByTestId('invoice-amount-due')).toHaveText('$0.00');
    await expect(page.getByTestId('invoice-paid')).toHaveText('$12.40');
    await expect(page.getByTestId('invoice-cash-due')).toHaveText('$0.00');
    await expect(page.getByTestId('invoice-cash-rounding')).toHaveText('$0.02');
    await expect.poll(() => auditLines()).toContain('PAYMENT_RECORDED id=1 invoice=1 amount=12.40');
    await expect.poll(() => auditLines()).toContain('CASH_ROUNDING id=1 amount=0.02');
    await expect(page.getByTestId('client-row-1').getByTestId('client-credit')).toHaveText('$0.00');

    await page.getByTestId('invoice-row-2').click();
    await expect(page.getByTestId('invoice-panel-number')).toHaveText(await page.getByTestId('invoice-row-2').getByTestId('invoice-number').innerText());
    // 12.36 rounds down to 12.35
    await expect(page.getByTestId('invoice-cash-due')).toHaveText('$12.35');
    await expect(page.getByTestId('invoice-cash-rounding')).toHaveText('-$0.01');
    await page.getByTestId('payment-form-method').selectOption('CASH');
    await page.getByTestId('payment-form-amount').fill('12.35');
    await page.getByTestId('payment-form-date').fill('2026-03-10');
    await page.getByTestId('payment-form-submit').click();
    await expect(page.getByTestId('invoice-panel-status')).toHaveText('Paid');
    await expect.poll(() => auditLines()).toContain('CASH_ROUNDING id=2 amount=-0.01');
    await expect(page.getByTestId('client-row-1').getByTestId('client-balance')).toHaveText('$0.00');
    // euro cash rounds the same way: 12.38 euros
    await page.getByTestId('client-row-2').click();
    await page.getByTestId('invoice-row-3').click();
    await expect(page.getByTestId('invoice-panel-number')).toHaveText(await page.getByTestId('invoice-row-3').getByTestId('invoice-number').innerText());
    await expect(page.getByTestId('invoice-cash-due')).toHaveText('€12.40');
    await page.getByTestId('payment-form-method').selectOption('CASH');
    await page.getByTestId('payment-form-amount').fill('12.40');
    await page.getByTestId('payment-form-date').fill('2026-03-10');
    await page.getByTestId('payment-form-submit').click();
    await expect(page.getByTestId('invoice-panel-status')).toHaveText('Paid');
    await expect(page.getByTestId('invoice-amount-due')).toHaveText('€0.00');
  });

  test('cash must be counted out in five cents against the open invoice', { tag: '@error' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-03-10',
      settings: { taxRate: 10, usdPer: { EUR: 1.1, GBP: 1.25, JPY: 0.0066, CHF: 1.13 } },
      clients: [
        { id: 1, name: 'Acme Ltd', email: 'ops@acme.example' },
        { id: 3, name: 'Kaisha KK', email: 'ap@kaisha.example', currency: 'JPY' },
      ],
      invoices: [
        { id: 1, clientId: 1, status: 'SENT', issueDate: '2026-03-01', dueDate: '2026-04-30',
          lineItems: [{ id: 1, description: 'Beans', qty: 1, unitPrice: 11.25 }] },
        { id: 4, clientId: 3, status: 'SENT', issueDate: '2026-03-01', dueDate: '2026-04-30',
          lineItems: [{ id: 4, description: 'Beans', qty: 1, unitPrice: 2125 }] },
      ],
    });
    await page.goto('/');

    await page.getByTestId('client-row-1').click();
    // no invoice open: cash is refused
    await page.getByTestId('payment-form-method').selectOption('CASH');
    await page.getByTestId('payment-form-amount').fill('12.40');
    await page.getByTestId('payment-form-date').fill('2026-03-10');
    await page.getByTestId('payment-form-submit').click();
    await expect(page.getByTestId('payment-form-error')).toBeVisible();
    await page.getByTestId('invoice-row-1').click();
    // 12.38 cannot be counted out in coins of five cents
    await page.getByTestId('payment-form-method').selectOption('CASH');
    await page.getByTestId('payment-form-amount').fill('12.38');
    await page.getByTestId('payment-form-date').fill('2026-03-10');
    await page.getByTestId('payment-form-submit').click();
    await expect(page.getByTestId('payment-form-error')).toBeVisible();
    // cash comes only in the client's own currency
    await page.getByTestId('payment-form-currency').selectOption('EUR');
    await page.getByTestId('payment-form-method').selectOption('CASH');
    await page.getByTestId('payment-form-amount').fill('12.40');
    await page.getByTestId('payment-form-date').fill('2026-03-10');
    await page.getByTestId('payment-form-submit').click();
    await expect(page.getByTestId('payment-form-error')).toBeVisible();
    await expect(page.getByTestId('invoice-paid')).toHaveText('$0.00');
    expect(auditLines().filter((l) => l.startsWith('PAYMENT_RECORDED'))).toEqual([]);
    // part of it in cash is fine: 12.38 - 5.00 leaves 7.38
    await page.getByTestId('payment-form-currency').selectOption('USD');
    await page.getByTestId('payment-form-method').selectOption('CASH');
    await page.getByTestId('payment-form-amount').fill('5');
    await page.getByTestId('payment-form-date').fill('2026-03-10');
    await page.getByTestId('payment-form-submit').click();
    await expect(page.getByTestId('invoice-amount-due')).toHaveText('$7.38');
    await expect(page.getByTestId('invoice-cash-due')).toHaveText('$7.40');
    await expect(page.getByTestId('invoice-panel-status')).toHaveText('Part paid');
    // yen have no coins smaller than one yen: nothing to round
    await page.getByTestId('client-row-3').click();
    await page.getByTestId('invoice-row-4').click();
    await expect(page.getByTestId('invoice-panel-number')).toHaveText(await page.getByTestId('invoice-row-4').getByTestId('invoice-number').innerText());
    await expect(page.getByTestId('invoice-cash-due')).toHaveText('¥2,338');
    await expect(page.getByTestId('invoice-cash-rounding')).toHaveText('¥0');
  });
});
