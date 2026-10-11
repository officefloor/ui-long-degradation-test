import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// Lines priced from a rate card or the price list are already at a negotiated price: the invoice
// discount (a percentage, a fixed amount or the volume discount) is worked out on, and shared over,
// the other lines only. Their own line discounts still apply, and the volume threshold still looks
// at the whole subtotal.
test.describe('rate-card lines take no invoice discount', () => {
  test('takes the invoice discount off lines not priced from a rate card', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-03-10',
      settings: {
        taxRate: 10,
        usdPer: { EUR: 1.1, GBP: 1.25, JPY: 0.0066, CHF: 1.13 },
        volumeDiscounts: [
          { over: 1000, pct: 3 },
          { over: 5000, pct: 6 },
        ],
        rates: [
          { unitType: 'hour', unitPrice: 120 },
          { unitType: 'licence', tiers: [{ units: 10, unitPrice: 20 }, { unitPrice: 15 }] },
        ],
      },
      clients: [
        { id: 1, name: 'Acme Ltd', email: 'ops@acme.example', rates: [{ unitType: 'hour', unitPrice: 95 }] },
      ],
      invoices: [
        { id: 1, clientId: 1, status: 'DRAFT', issueDate: '2026-03-01', dueDate: '2026-04-30',
          discountPct: 10,
          lineItems: [
            { id: 1, description: 'Consulting', qty: 10, unitType: 'hour' },
            { id: 2, description: 'Licences', qty: 12, unitType: 'licence' },
            { id: 3, description: 'Hardware', qty: 1, unitPrice: 300 },
            { id: 4, description: 'Cabling', qty: 1, unitPrice: 120.4 },
          ] },
      ],
    });
    await page.goto('/');

    await page.getByTestId('client-row-1').click();
    await page.getByTestId('invoice-row-1').click();
    // 950.00 + 230.00 + 300.00 + 120.40 = 1,600.40; the discount is 10% of the 420.40 not priced from
    // the card or the price list: 42.04 (the 3% volume discount, 12.61, is smaller)
    await expect(page.getByTestId('invoice-subtotal')).toHaveText('$1,600.40');
    await expect(page.getByTestId('invoice-discount')).toHaveText('$42.04');
    await expect(page.getByTestId('line-row-1').getByTestId('line-discount-share')).toHaveText('$0.00');
    await expect(page.getByTestId('line-row-2').getByTestId('line-discount-share')).toHaveText('$0.00');
    await expect(page.getByTestId('line-row-3').getByTestId('line-discount-share')).toHaveText('$30.00');
    await expect(page.getByTestId('line-row-4').getByTestId('line-discount-share')).toHaveText('$12.04');
    await expect(page.getByTestId('invoice-tax')).toHaveText('$155.84');
    await expect(page.getByTestId('invoice-grand-total')).toHaveText('$1,714.20');
  });
});
