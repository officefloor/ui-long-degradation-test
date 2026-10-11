import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';
import { auditLines } from '../support/audit';

// UPDATED for cp92 (mutates: [15, 40, 59]): a small balance is now written off only when it is
// under $2.00 and no more than 1% of the grand total, so the 140 yen left of 5,006 stays due.
// Carries both tests.
// A client can be billed in their own currency (clients[].currency, chosen when adding the client:
// USD by default, EUR, GBP, JPY or CHF). Everything on their invoices, payments, credit and balance
// is in that currency with its symbol: $1,234.50, €1,234.50, £1,234.50, ¥1,235, CHF 1,234.50. Yen
// have no decimals: every amount for a yen client is rounded to the whole yen wherever it would be
// rounded to the cent, amounts entered for them must be whole yen, and audit lines show whole yen.
// A small balance is written off when it is worth less than $2.00 at the workspace rates and is no
// more than 1% of the grand total (settings.usdPer: the US dollars one unit of each currency is
// worth).
test.describe('clients billed in their own currency', () => {
  test('bills a yen client in whole yen', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-03-10',
      settings: { taxRate: 10, usdPer: { EUR: 1.1, GBP: 1.25, JPY: 0.0066, CHF: 1.13 } },
      clients: [{ id: 3, name: 'Kaisha KK', email: 'ap@kaisha.example', currency: 'JPY' }],
      invoices: [
        { id: 4, clientId: 3, status: 'SENT', issueDate: '2026-03-01', dueDate: '2026-04-30',
          discountPct: 12.5,
          lineItems: [
            { id: 1, description: 'Consulting', qty: 3, unitPrice: 1234 },
            { id: 2, description: 'Support', qty: 1.5, unitPrice: 999 },
          ] },
        { id: 5, clientId: 3, status: 'SENT', issueDate: '2026-03-01', dueDate: '2026-04-30',
          lineItems: [{ id: 3, description: 'Licence', qty: 1, unitPrice: 10000 }] },
      ],
    });
    await page.goto('/');

    await page.getByTestId('client-row-3').click();
    await page.getByTestId('invoice-row-4').click();
    // 3 x 1,234 = 3,702; 1.5 x 999 = 1,498.5 -> 1,499 (whole yen, half up)
    await expect(page.getByTestId('line-row-2').getByTestId('line-amount')).toHaveText('¥1,499');
    await expect(page.getByTestId('invoice-subtotal')).toHaveText('¥5,201');
    // 12.5% of 5,201 = 650.125 -> 650, split 3,702 : 1,499 by largest remainder
    await expect(page.getByTestId('invoice-discount')).toHaveText('¥650');
    await expect(page.getByTestId('line-row-1').getByTestId('line-discount-share')).toHaveText('¥463');
    await expect(page.getByTestId('line-row-1').getByTestId('line-tax')).toHaveText('¥324'); // 10% of (3,702 - 463) = 323.9
    await expect(page.getByTestId('line-row-2').getByTestId('line-tax')).toHaveText('¥131'); // 10% of (1,499 - 187) = 131.2
    await expect(page.getByTestId('invoice-grand-total')).toHaveText('¥5,006');
    // amounts I enter for a yen client are whole yen
    await page.getByTestId('payment-form-amount').fill('100.5');
    await page.getByTestId('payment-form-date').fill('2026-03-09');
    await page.getByTestId('payment-form-submit').click();
    await expect(page.getByTestId('payment-form-error')).toBeVisible();
    // leaves 140 yen, worth 140 x 0.0066 = $0.92: but that is more than 1% of 5,006, so it stays due
    await page.getByTestId('payment-form-amount').fill('4866');
    await page.getByTestId('payment-form-submit').click();
    await expect(page.getByTestId('invoice-written-off')).toHaveText('¥0');
    await expect(page.getByTestId('invoice-panel-status')).toHaveText('Part paid');
    await expect.poll(() => auditLines()).toContain('PAYMENT_RECORDED id=1 invoice=4 amount=4866');
    expect(auditLines().filter((l) => l.startsWith('INVOICE_WRITTEN_OFF'))).toEqual([]);
    // 10,000 + 1,000 tax; leaving 160 yen, worth 160 x 0.0066 = $1.06: it stays due
    await page.getByTestId('invoice-row-5').click();
    await page.getByTestId('payment-form-amount').fill('10840');
    await page.getByTestId('payment-form-date').fill('2026-03-09');
    await page.getByTestId('payment-form-submit').click();
    await expect(page.getByTestId('invoice-amount-due')).toHaveText('¥160');
    await expect(page.getByTestId('invoice-panel-status')).toHaveText('Part paid');
    await expect(page.getByTestId('client-row-3').getByTestId('client-balance')).toHaveText('¥300');
  });

  test("shows each client's money in their currency", { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-03-10',
      settings: { usdPer: { EUR: 1.1, GBP: 1.25, JPY: 0.0066, CHF: 1.13 } },
      clients: [
        { id: 1, name: 'Acme Ltd', email: 'ops@acme.example' },
        { id: 2, name: 'Globex Corp', email: 'billing@globex.example', currency: 'EUR' },
        { id: 5, name: 'Helvetia AG', email: 'ap@helvetia.example', currency: 'CHF' },
        { id: 6, name: 'Britco Ltd', email: 'ap@britco.example', currency: 'GBP' },
      ],
      invoices: [
        { id: 1, clientId: 1, status: 'SENT', issueDate: '2026-03-01', dueDate: '2026-04-30',
          lineItems: [{ id: 1, description: 'Design', qty: 1, unitPrice: 100 }] },
        { id: 2, clientId: 2, status: 'SENT', issueDate: '2026-03-01', dueDate: '2026-04-30',
          lineItems: [{ id: 2, description: 'Design', qty: 2, unitPrice: 617.25 }] },
        { id: 3, clientId: 5, status: 'SENT', issueDate: '2026-03-01', dueDate: '2026-04-30',
          lineItems: [{ id: 3, description: 'Design', qty: 1, unitPrice: 99.95 }] },
        { id: 4, clientId: 6, status: 'SENT', issueDate: '2026-03-01', dueDate: '2026-04-30',
          lineItems: [{ id: 4, description: 'Design', qty: 3, unitPrice: 4.1 }] },
      ],
    });
    await page.goto('/');

    await expect(page.getByTestId('client-row-1').getByTestId('client-balance')).toHaveText('$100.00');
    await expect(page.getByTestId('client-row-2').getByTestId('client-balance')).toHaveText('€1,234.50'); // 2 x 617.25
    await expect(page.getByTestId('client-row-5').getByTestId('client-balance')).toHaveText('CHF 99.95');
    await expect(page.getByTestId('client-row-6').getByTestId('client-balance')).toHaveText('£12.30'); // 3 x 4.10
    await page.getByTestId('client-form-name').fill('Initech');
    await page.getByTestId('client-form-email').fill('ap@initech.example');
    await page.getByTestId('client-form-currency').selectOption('EUR');
    await page.getByTestId('client-form-submit').click();
    await expect(page.getByTestId('client-row-7').getByTestId('client-balance')).toHaveText('€0.00');
    await page.getByTestId('client-row-7').click();
    await page.getByTestId('invoice-new').click();
    await page.getByTestId('line-form-description').fill('Hosting');
    await page.getByTestId('line-form-qty').fill('2');
    await page.getByTestId('line-form-unit-price').fill('12.25');
    await page.getByTestId('line-form-submit').click();
    await expect(page.getByTestId('invoice-grand-total')).toHaveText('€24.50'); // 2 x 12.25
    await expect(page.getByTestId('invoice-row-5').getByTestId('invoice-total')).toHaveText('€24.50');
  });
});
