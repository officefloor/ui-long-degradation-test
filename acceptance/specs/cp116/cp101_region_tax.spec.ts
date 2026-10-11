import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// UPDATED for cp116 (mutates: [72, 101, 106]): the tax is now rounded once per rate, so the New
// York invoice's 8.875% lines (9.58855 -> 9.59) and its 5% handbook (1.125 -> 1.13) come to 10.72
// instead of 10.71. Carries both tests.
// A client can have a region (clients[].region, the Region box on the client form). Their invoices
// are taxed at that region's rate from the workspace's regional rates (settings.regionTaxRates,
// region -> percentage) instead of the workspace rate; with no region, or a region that has no rate
// listed, the workspace rate applies. A line's own tax rate still wins, exempt lines and tax-exempt
// clients pay none, and the invoice tax is still rounded once per rate on the exact line taxes and
// shared over the lines.
test.describe('tax by client region', () => {
  test("taxes each client's invoices at their region's rate", { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-03-10',
      settings: { taxRate: 10, regionTaxRates: { NY: 8.875, CA: 7.25, OR: 0 } },
      clients: [
        { id: 1, name: 'Acme Ltd', email: 'ops@acme.example', region: 'NY' },
        { id: 2, name: 'Globex Corp', email: 'billing@globex.example', region: 'OR' },
        { id: 3, name: 'Initech', email: 'ap@initech.example', region: 'TX' },
      ],
      invoices: [
        { id: 1, clientId: 1, status: 'DRAFT', issueDate: '2026-03-01', dueDate: '2026-04-30',
          discountPct: 10,
          lineItems: [
            { id: 1, description: 'Design', qty: 3, unitPrice: 33.35 },
            { id: 2, description: 'Hosting', qty: 1, unitPrice: 19.99 },
            { id: 3, description: 'Handbook', qty: 2, unitPrice: 12.5, taxRate: 5 },
          ] },
        { id: 2, clientId: 2, status: 'DRAFT', issueDate: '2026-03-01', dueDate: '2026-04-30',
          lineItems: [
            { id: 4, description: 'Design', qty: 3, unitPrice: 33.35 },
            { id: 5, description: 'Handbook', qty: 2, unitPrice: 12.5, taxRate: 5 },
          ] },
        { id: 3, clientId: 3, status: 'DRAFT', issueDate: '2026-03-01', dueDate: '2026-04-30',
          lineItems: [{ id: 6, description: 'Design', qty: 3, unitPrice: 33.35 }] },
      ],
    });
    await page.goto('/');

    await page.getByTestId('client-row-1').click();
    await page.getByTestId('invoice-row-1').click();
    // New York, 8.875%: 8.875% of 90.05 (100.05 less its 10.00 share of the discount) = 7.9919375,
    // of 17.99 = 1.5966125; the handbook keeps its own 5%: 1.125. Per rate, 9.58855 at 8.875%
    // rounds to 9.59 and 1.125 at 5% to 1.13: 10.72
    await expect(page.getByTestId('invoice-tax')).toHaveText('$10.72');
    await expect(page.getByTestId('line-row-1').getByTestId('line-tax')).toHaveText('$7.99');
    await expect(page.getByTestId('line-row-2').getByTestId('line-tax')).toHaveText('$1.60');
    await expect(page.getByTestId('line-row-3').getByTestId('line-tax')).toHaveText('$1.13');
    await expect(page.getByTestId('invoice-grand-total')).toHaveText('$141.26'); // 145.04 - 14.50 + 10.72
    // Oregon charges no tax; the handbook's own rate still applies
    await page.getByTestId('client-row-2').click();
    await page.getByTestId('invoice-row-2').click();
    await expect(page.getByTestId('line-row-4').getByTestId('line-tax')).toHaveText('$0.00');
    await expect(page.getByTestId('invoice-tax')).toHaveText('$1.25'); // 5% of 25.00
    await expect(page.getByTestId('invoice-grand-total')).toHaveText('$126.30');
    // Texas has no rate listed: the workspace's 10%
    await page.getByTestId('client-row-3').click();
    await page.getByTestId('invoice-row-3').click();
    await expect(page.getByTestId('invoice-tax')).toHaveText('$10.01'); // 10% of 100.05 = 10.005
    await expect(page.getByTestId('invoice-grand-total')).toHaveText('$110.06');
  });

  test('adds a client with a region', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-03-10',
      settings: { taxRate: 10, regionTaxRates: { NY: 8.875, CA: 7.25, OR: 0 } },
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      invoices: [
        { id: 1, clientId: 1, status: 'DRAFT', issueDate: '2026-03-01', dueDate: '2026-04-30',
          lineItems: [{ id: 1, description: 'Design', qty: 2, unitPrice: 49.99 }] },
      ],
    });
    await page.goto('/');

    await page.getByTestId('client-form-name').fill('Umbrella Co');
    await page.getByTestId('client-form-email').fill('ap@umbrella.example');
    await page.getByTestId('client-form-region').fill('CA');
    await page.getByTestId('client-form-submit').click();
    await page.getByTestId('client-row-2').click();
    await page.getByTestId('invoice-new').click();
    await page.getByTestId('line-form-description').fill('Design');
    await page.getByTestId('line-form-qty').fill('2');
    await page.getByTestId('line-form-unit-price').fill('49.99');
    await page.getByTestId('line-form-submit').click();
    // California, 7.25% of 99.98 = 7.24855
    await expect(page.getByTestId('invoice-tax')).toHaveText('$7.25');
    await expect(page.getByTestId('invoice-row-2').getByTestId('invoice-total')).toHaveText('$107.23');
    // a client with no region keeps the workspace rate: 10% of 99.98
    await page.getByTestId('client-row-1').click();
    await page.getByTestId('invoice-row-1').click();
    await expect(page.getByTestId('invoice-tax')).toHaveText('$10.00');
  });
});
