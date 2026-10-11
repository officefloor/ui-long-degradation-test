import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// The workspace can give volume discounts (settings.volumeDiscounts: over, pct, the thresholds in
// US dollars converted to the client's currency at the issue date's rate, rounded down). An invoice
// whose subtotal is over a threshold gets the percentage of the highest one it passes, rounded down
// to the cent, as its discount when that is more than its own discount; it is then capped, split
// over the lines and taxed like any invoice discount.
test.describe('volume discount', () => {
  test('gives a volume discount on large invoices', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-03-10',
      settings: {
        taxRate: 10,
        usdPer: { EUR: 1.1, GBP: 1.25, JPY: 0.0066, CHF: 1.13 },
        volumeDiscounts: [
          { over: 1000, pct: 3 },
          { over: 5000, pct: 6 },
        ],
      },
      clients: [
        { id: 1, name: 'Acme Ltd', email: 'ops@acme.example' },
        { id: 2, name: 'Globex Corp', email: 'billing@globex.example', currency: 'EUR' },
      ],
      invoices: [
        { id: 1, clientId: 1, status: 'DRAFT', issueDate: '2026-03-01', dueDate: '2026-04-30', discountPct: 2,
          lineItems: [
            { id: 1, description: 'Build', qty: 1, unitPrice: 1000 },
            { id: 2, description: 'Hosting', qty: 1, unitPrice: 200.5 },
          ] },
        { id: 2, clientId: 1, status: 'DRAFT', issueDate: '2026-03-01', dueDate: '2026-04-30',
          discountPct: 10,
          lineItems: [{ id: 3, description: 'Build', qty: 1, unitPrice: 1200 }] },
        { id: 3, clientId: 1, status: 'DRAFT', issueDate: '2026-03-01', dueDate: '2026-04-30',
          discountCap: 200,
          lineItems: [{ id: 4, description: 'Build', qty: 1, unitPrice: 5200 }] },
        { id: 4, clientId: 2, status: 'DRAFT', issueDate: '2026-03-01', dueDate: '2026-04-30',
          lineItems: [{ id: 5, description: 'Build', qty: 1, unitPrice: 950 }] },
        { id: 5, clientId: 1, status: 'DRAFT', issueDate: '2026-03-01', dueDate: '2026-04-30',
          lineItems: [{ id: 6, description: 'Build', qty: 1, unitPrice: 1000 }] },
      ],
    });
    await page.goto('/');

    await page.getByTestId('client-row-1').click();
    await page.getByTestId('invoice-row-1').click();
    // 1,200.50 is over 1,000.00: 3% (36.01) beats the invoice's own 2% (24.01)
    await expect(page.getByTestId('invoice-discount')).toHaveText('$36.01');
    await expect(page.getByTestId('line-row-1').getByTestId('line-discount-share')).toHaveText('$30.00');
    await expect(page.getByTestId('line-row-2').getByTestId('line-discount-share')).toHaveText('$6.01');
    await expect(page.getByTestId('invoice-grand-total')).toHaveText('$1,280.94');
    // the invoice's own 10% is larger
    await page.getByTestId('invoice-row-2').click();
    await expect(page.getByTestId('invoice-discount')).toHaveText('$120.00');
    // over 5,000.00: 6% of 5,200.00 = 312.00, held to the 200.00 cap
    await page.getByTestId('invoice-row-3').click();
    await expect(page.getByTestId('invoice-discount')).toHaveText('$200.00');
    await expect(page.getByTestId('invoice-grand-total')).toHaveText('$5,500.00');
    // exactly 1,000.00 is not over the threshold
    await page.getByTestId('invoice-row-5').click();
    await expect(page.getByTestId('invoice-discount')).toHaveText('$0.00');
    // in euros the threshold is 1,000 / 1.10 = 909.09: €950.00 gets 3% (28.50)
    await page.getByTestId('client-row-2').click();
    await page.getByTestId('invoice-row-4').click();
    await expect(page.getByTestId('invoice-discount')).toHaveText('€28.50');
    await expect(page.getByTestId('invoice-grand-total')).toHaveText('€1,013.65');
  });
});
