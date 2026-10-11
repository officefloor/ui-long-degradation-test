import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';
import { auditLines } from '../support/audit';

// UPDATED for cp124 (mutates: [102, 117]): a reverse-charged invoice now carries no withholding;
// the three tests' clients are taxed as usual, so their figures hold, and a new test shows a
// reverse-charged client paying the whole 1,000.00. Carries all three tests.
// A client can withhold tax (clients[].withholdingPct, on the client form): their invoices show the
// withholding, that percentage of the amount before tax rounded down to the cent, which the client
// never pays: the amount due, balance and everything worked out from what is owed leave it out, and
// the invoice is Paid once the rest is paid. Sending writes WITHHOLDING id=<id> amount=<withheld>.
// An instalment plan spreads the grand total less the withholding. Credit notes and reverse-charged
// invoices have none.
test.describe('withholding tax', () => {
  test("withholds part of the client's payment for their tax office", { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-03-10',
      settings: { taxRate: 10, regionTaxRates: { NY: 8.875, CA: 7.25, OR: 0 } },
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example', region: 'NY', withholdingPct: 10 }],
      invoices: [
        { id: 1, clientId: 1, status: 'DRAFT', issueDate: '2026-03-01', dueDate: '2026-04-30',
          lineItems: [
            { id: 1, description: 'Consulting', qty: 1, unitPrice: 1000 },
            { id: 2, description: 'Handbook', qty: 2, unitPrice: 12.5, taxRate: 5 },
          ] },
      ],
    });
    await page.goto('/');

    await page.getByTestId('client-row-1').click();
    await page.getByTestId('invoice-row-1').click();
    // 10% of the 1,025.00 before tax is withheld; the client pays the grand total less that
    await expect(page.getByTestId('invoice-withholding')).toHaveText('$102.50');
    await expect(page.getByTestId('invoice-grand-total')).toHaveText('$1,115.00'); // 1,025.00 + 88.75 + 1.25
    await expect(page.getByTestId('invoice-amount-due')).toHaveText('$1,012.50'); // 1,115.00 - 102.50
    await page.getByTestId('invoice-send').click();
    await expect.poll(() => auditLines()).toContain('WITHHOLDING id=1 amount=102.50');
    await expect(page.getByTestId('client-row-1').getByTestId('client-balance')).toHaveText('$1,012.50');
    await page.getByTestId('payment-form-amount').fill('1012.50');
    await page.getByTestId('payment-form-date').fill('2026-03-10');
    await page.getByTestId('payment-form-submit').click();
    await expect(page.getByTestId('invoice-panel-status')).toHaveText('Paid');
    await expect(page.getByTestId('invoice-amount-due')).toHaveText('$0.00');
  });

  test('an instalment plan spreads what the client pays', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-01-31',
      settings: { taxRate: 10, regionTaxRates: { NY: 8.875, CA: 7.25, OR: 0 } },
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example', region: 'NY', withholdingPct: 10 }],
      invoices: [
        { id: 2, clientId: 1, status: 'DRAFT', issueDate: '2026-01-31', dueDate: '2026-02-28',
          lineItems: [{ id: 1, description: 'Consulting', qty: 1, unitPrice: 1000 }] },
      ],
    });
    await page.goto('/');

    await page.getByTestId('client-row-1').click();
    await page.getByTestId('invoice-row-2').click();
    await page.getByTestId('plan-form-count').fill('2');
    await page.getByTestId('plan-form-rate').fill('0');
    await page.getByTestId('plan-form-submit').click();
    // 1,088.75 less 100.00 withheld = 988.75 over 2: 494.375, rounded up to 495.00, then 493.75
    await expect(page.getByTestId('instalment-row-1').getByTestId('instalment-payment')).toHaveText('$495.00');
    await expect(page.getByTestId('instalment-row-2').getByTestId('instalment-payment')).toHaveText('$493.75');
    await expect(page.getByTestId('invoice-plan-total')).toHaveText('$988.75');
  });

  test('sets a withholding rate when adding a client', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-03-10',
      settings: { taxRate: 10, regionTaxRates: { NY: 8.875, CA: 7.25, OR: 0 } },
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
    });
    await page.goto('/');

    await page.getByTestId('client-form-name').fill('Umbrella Co');
    await page.getByTestId('client-form-email').fill('ap@umbrella.example');
    await page.getByTestId('client-form-withholding-pct').fill('5');
    await page.getByTestId('client-form-submit').click();
    await page.getByTestId('client-row-2').click();
    await page.getByTestId('invoice-new').click();
    await page.getByTestId('line-form-description').fill('Design');
    await page.getByTestId('line-form-qty').fill('1');
    await page.getByTestId('line-form-unit-price').fill('100');
    await page.getByTestId('line-form-submit').click();
    await expect(page.getByTestId('invoice-withholding')).toHaveText('$5.00'); // 5% of 100.00
    await expect(page.getByTestId('invoice-amount-due')).toHaveText('$105.00'); // 110.00 - 5.00
  });

  test('a reverse-charged invoice has no withholding', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-03-10',
      settings: { taxRate: 10, regionTaxRates: { NY: 8.875, CA: 7.25, OR: 0 }, homeRegion: 'NY' },
      clients: [
        { id: 2, name: 'Globex Corp', email: 'billing@globex.example', region: 'CA',
          taxNumber: 'CA2048163017', withholdingPct: 10 },
      ],
      invoices: [
        { id: 2, clientId: 2, status: 'DRAFT', issueDate: '2026-03-01', dueDate: '2026-04-30',
          lineItems: [{ id: 1, description: 'Consulting', qty: 1, unitPrice: 1000 }] },
      ],
    });
    await page.goto('/');

    await page.getByTestId('client-row-2').click();
    await page.getByTestId('invoice-row-2').click();
    await expect(page.getByTestId('invoice-reverse-charge')).toHaveText('Reverse charge');
    await expect(page.getByTestId('invoice-withholding')).toHaveText('$0.00');
    await expect(page.getByTestId('invoice-amount-due')).toHaveText('$1,000.00');
  });
});
