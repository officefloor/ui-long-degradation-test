import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// A client can have their own minimum charge (clients[].minimumCharge, on the client form), in
// their own currency with no conversion; it replaces the workspace's for their invoices, and 0
// means no minimum charge at all.
test.describe('client minimum charge', () => {
  test("a client's own minimum charge replaces the workspace's", { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-03-10',
      settings: {
        taxRate: 10,
        regionTaxRates: { NY: 8.875, CA: 7.25, OR: 0 },
        minimumCharge: 50,
        usdPer: { EUR: 1.1, GBP: 1.25, JPY: 0.0066, CHF: 1.13 },
      },
      clients: [
        { id: 1, name: 'Acme Ltd', email: 'ops@acme.example', region: 'NY', minimumCharge: 0 },
        { id: 2, name: 'Globex Corp', email: 'billing@globex.example', currency: 'EUR', minimumCharge: 40 },
        { id: 3, name: 'Initech', email: 'ap@initech.example', region: 'NY' },
      ],
      invoices: [
        { id: 1, clientId: 1, status: 'DRAFT', issueDate: '2026-03-01', dueDate: '2026-04-30',
          lineItems: [{ id: 1, description: 'Design', qty: 1, unitPrice: 30 }] },
        { id: 2, clientId: 2, status: 'DRAFT', issueDate: '2026-03-01', dueDate: '2026-04-30',
          lineItems: [{ id: 2, description: 'Design', qty: 1, unitPrice: 30 }] },
        { id: 3, clientId: 3, status: 'DRAFT', issueDate: '2026-03-01', dueDate: '2026-04-30',
          lineItems: [{ id: 3, description: 'Design', qty: 1, unitPrice: 30 }] },
      ],
    });
    await page.goto('/');

    // Acme's minimum is 0: no minimum charge at all
    await page.getByTestId('client-row-1').click();
    await page.getByTestId('invoice-row-1').click();
    await expect(page.getByTestId('invoice-minimum-charge')).toHaveText('$0.00');
    await expect(page.getByTestId('invoice-grand-total')).toHaveText('$32.66');
    // Globex's own €40.00, in its currency, not the workspace's $50.00 converted (€45.45)
    await page.getByTestId('client-row-2').click();
    await page.getByTestId('invoice-row-2').click();
    await expect(page.getByTestId('invoice-panel-number')).toHaveText(await page.getByTestId('invoice-row-2').getByTestId('invoice-number').innerText());
    await expect(page.getByTestId('invoice-minimum-charge')).toHaveText('€10.00');
    await expect(page.getByTestId('invoice-grand-total')).toHaveText('€44.00'); // 40.00 + 10%
    // no minimum of its own: the workspace's 50.00
    await page.getByTestId('client-row-3').click();
    await page.getByTestId('invoice-row-3').click();
    await expect(page.getByTestId('invoice-panel-number')).toHaveText(await page.getByTestId('invoice-row-3').getByTestId('invoice-number').innerText());
    await expect(page.getByTestId('invoice-minimum-charge')).toHaveText('$20.00');
  });

  test('sets a minimum charge when adding a client', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-03-10',
      settings: {
        taxRate: 10,
        regionTaxRates: { NY: 8.875, CA: 7.25, OR: 0 },
        minimumCharge: 50,
        usdPer: { EUR: 1.1, GBP: 1.25, JPY: 0.0066, CHF: 1.13 },
      },
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
    });
    await page.goto('/');

    await page.getByTestId('client-form-name').fill('Umbrella Co');
    await page.getByTestId('client-form-email').fill('ap@umbrella.example');
    await page.getByTestId('client-form-minimum-charge').fill('75');
    await page.getByTestId('client-form-submit').click();
    await page.getByTestId('client-row-2').click();
    await page.getByTestId('invoice-new').click();
    await page.getByTestId('line-form-description').fill('Design');
    await page.getByTestId('line-form-qty').fill('1');
    await page.getByTestId('line-form-unit-price').fill('60');
    await page.getByTestId('line-form-submit').click();
    await expect(page.getByTestId('invoice-minimum-charge')).toHaveText('$15.00'); // 75.00 - 60.00
    await expect(page.getByTestId('invoice-grand-total')).toHaveText('$82.50'); // 75.00 + 10%
  });
});
