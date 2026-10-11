import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// A draft is priced and taxed as of today, whatever date it carries, since it will be dated today
// when sent: the rate card or price list entry in force today, today's exchange rates for anything
// converted from US dollars, this month's volume for tiers, the region's tax rate in force today,
// and the client's tax exemption as it stands today. Sent invoices and credit notes keep the rates
// of their issue date.
test.describe("drafts at today's rates", () => {
  test("a draft is priced and taxed at today's rates", { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-04-10',
      settings: {
        taxRate: 10,
        regionTaxRates: { NY: 8.875, CA: 7.25, OR: 0 },
        taxRateChanges: [
          { region: 'NY', from: '2026-04-01', rate: 9.25 },
        ],
      },
      clients: [
        { id: 1, name: 'Acme Ltd', email: 'ops@acme.example', region: 'NY',
          rates: [
            { unitType: 'hour', unitPrice: 95 },
            { unitType: 'hour', unitPrice: 105, from: '2026-04-01' },
            { unitType: 'licence', tiers: [{ units: 10, unitPrice: 20 }, { unitPrice: 15 }] },
            { unitType: 'licence', from: '2026-04-01', tiers: [{ units: 10, unitPrice: 22 }, { unitPrice: 16 }] },
          ] },
        { id: 2, name: 'Globex Corp', email: 'billing@globex.example', taxExempt: true,
          taxExemptUntil: '2026-03-31' },
      ],
      invoices: [
        { id: 1, clientId: 1, status: 'DRAFT', issueDate: '2026-03-20', dueDate: '2026-04-30',
          lineItems: [{ id: 1, description: 'Consulting', qty: 2, unitType: 'hour' }] },
        { id: 2, clientId: 1, status: 'SENT', issueDate: '2026-03-20', dueDate: '2026-04-30',
          lineItems: [{ id: 2, description: 'Consulting', qty: 2, unitType: 'hour' }] },
        { id: 3, clientId: 2, status: 'DRAFT', issueDate: '2026-03-20', dueDate: '2026-04-30',
          lineItems: [{ id: 3, description: 'Catering', qty: 1, unitPrice: 400 }] },
      ],
    });
    await page.goto('/');

    await page.getByTestId('client-row-1').click();
    await page.getByTestId('invoice-row-1').click();
    // dated 2026-03-20 but still a draft: today's 105.00 an hour and today's 9.25% New York rate
    await expect(page.getByTestId('line-row-1').getByTestId('line-unit-price')).toHaveText('$105.00');
    await expect(page.getByTestId('line-row-1').getByTestId('line-amount')).toHaveText('$210.00');
    await expect(page.getByTestId('invoice-tax')).toHaveText('$19.43'); // 9.25% of 210.00
    await expect(page.getByTestId('invoice-grand-total')).toHaveText('$229.43');
    // the sent invoice of the same date keeps March's 95.00 and 8.875%
    await page.getByTestId('invoice-row-2').click();
    await expect(page.getByTestId('line-row-2').getByTestId('line-amount')).toHaveText('$190.00');
    await expect(page.getByTestId('invoice-tax')).toHaveText('$16.86');
    // Globex's exemption ended on 2026-03-31, so its draft is taxed today: 10% of 400.00
    await page.getByTestId('client-row-2').click();
    await page.getByTestId('invoice-row-3').click();
    await expect(page.getByTestId('invoice-tax')).toHaveText('$40.00');
  });
});
