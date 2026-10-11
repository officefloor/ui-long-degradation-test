import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// When an invoice's amount after its discounts is below the workspace's minimum charge
// (settings.minimumCharge, in US dollars, converted to the client's currency at the issue date's
// rate and rounded down to its step), the difference is added as a minimum charge: shown on the
// panel ($0.00 when none), not discounted, taxed at the client's standard rate (their region's,
// else the workspace's; none for exempt or reverse-charged clients) as if it were one more line,
// part of the grand total and of the amount before tax. Credit notes and invoices with no lines get
// none.
test.describe('minimum charge', () => {
  test('tops a small invoice up to the minimum charge', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-03-10',
      settings: {
        taxRate: 10,
        regionTaxRates: { NY: 8.875, CA: 7.25, OR: 0 },
        minimumCharge: 50,
        usdPer: { EUR: 1.1, GBP: 1.25, JPY: 0.0066, CHF: 1.13 },
      },
      clients: [
        { id: 1, name: 'Acme Ltd', email: 'ops@acme.example', region: 'NY' },
        { id: 2, name: 'Globex Corp', email: 'billing@globex.example', currency: 'EUR' },
      ],
      invoices: [
        { id: 1, clientId: 1, status: 'DRAFT', issueDate: '2026-03-01', dueDate: '2026-04-30',
          lineItems: [{ id: 1, description: 'Design', qty: 1, unitPrice: 30 }] },
        { id: 2, clientId: 1, status: 'DRAFT', issueDate: '2026-03-01', dueDate: '2026-04-30',
          discountPct: 20,
          lineItems: [{ id: 2, description: 'Design', qty: 1, unitPrice: 60 }] },
        { id: 3, clientId: 1, status: 'SENT', issueDate: '2026-03-01', dueDate: '2026-04-30',
          lineItems: [{ id: 3, description: 'Design', qty: 1, unitPrice: 80 }] },
        { id: 4, clientId: 2, status: 'DRAFT', issueDate: '2026-03-01', dueDate: '2026-04-30',
          lineItems: [{ id: 4, description: 'Design', qty: 1, unitPrice: 30 }] },
        { id: 5, clientId: 1, status: 'DRAFT', issueDate: '2026-03-05', dueDate: '2026-04-30', creditOf: 3,
          lineItems: [{ id: 5, description: 'Design', qty: 1, unitPrice: 20 }] },
      ],
    });
    await page.goto('/');

    await page.getByTestId('client-row-1').click();
    await page.getByTestId('invoice-row-1').click();
    // 30.00 is 20.00 short of the 50.00 minimum; the 50.00 is taxed at New York's 8.875% = 4.4375
    await expect(page.getByTestId('invoice-minimum-charge')).toHaveText('$20.00');
    await expect(page.getByTestId('invoice-tax')).toHaveText('$4.44');
    await expect(page.getByTestId('line-row-1').getByTestId('line-tax')).toHaveText('$2.66');
    await expect(page.getByTestId('invoice-grand-total')).toHaveText('$54.44'); // 30.00 + 20.00 + 4.44
    // the minimum is compared after the discount: 60.00 - 20% = 48.00, 2.00 short
    await page.getByTestId('invoice-row-2').click();
    await expect(page.getByTestId('invoice-panel-number')).toHaveText(await page.getByTestId('invoice-row-2').getByTestId('invoice-number').innerText());
    await expect(page.getByTestId('invoice-discount')).toHaveText('$12.00');
    await expect(page.getByTestId('invoice-minimum-charge')).toHaveText('$2.00');
    await expect(page.getByTestId('invoice-grand-total')).toHaveText('$54.44');
    await page.getByTestId('invoice-row-3').click();
    await expect(page.getByTestId('invoice-panel-number')).toHaveText(await page.getByTestId('invoice-row-3').getByTestId('invoice-number').innerText());
    await expect(page.getByTestId('invoice-minimum-charge')).toHaveText('$0.00');
    // a credit note gets no minimum charge
    await page.getByTestId('invoice-row-5').click();
    await expect(page.getByTestId('invoice-panel-number')).toHaveText(await page.getByTestId('invoice-row-5').getByTestId('invoice-number').innerText());
    await expect(page.getByTestId('invoice-minimum-charge')).toHaveText('$0.00');
    await expect(page.getByTestId('invoice-grand-total')).toHaveText('$21.78'); // 20.00 + 8.875%
    // in euros: $50.00 / 1.10 = 45.4545, rounded down to €45.45; taxed at the workspace 10%
    await page.getByTestId('client-row-2').click();
    await page.getByTestId('invoice-row-4').click();
    await expect(page.getByTestId('invoice-panel-number')).toHaveText(await page.getByTestId('invoice-row-4').getByTestId('invoice-number').innerText());
    await expect(page.getByTestId('invoice-minimum-charge')).toHaveText('€15.45');
    await expect(page.getByTestId('invoice-grand-total')).toHaveText('€50.00'); // 45.45 + 4.545 -> 4.55
  });

  test('drops the minimum charge once the lines reach it', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-03-10',
      settings: {
        taxRate: 10,
        regionTaxRates: { NY: 8.875, CA: 7.25, OR: 0 },
        minimumCharge: 50,
        usdPer: { EUR: 1.1, GBP: 1.25, JPY: 0.0066, CHF: 1.13 },
      },
      clients: [
        { id: 1, name: 'Acme Ltd', email: 'ops@acme.example', region: 'NY' },
        { id: 2, name: 'Globex Corp', email: 'billing@globex.example', currency: 'EUR' },
      ],
      invoices: [
        { id: 1, clientId: 1, status: 'DRAFT', issueDate: '2026-03-01', dueDate: '2026-04-30',
          lineItems: [{ id: 1, description: 'Design', qty: 1, unitPrice: 30 }] },
        { id: 2, clientId: 1, status: 'DRAFT', issueDate: '2026-03-01', dueDate: '2026-04-30',
          discountPct: 20,
          lineItems: [{ id: 2, description: 'Design', qty: 1, unitPrice: 60 }] },
        { id: 3, clientId: 1, status: 'SENT', issueDate: '2026-03-01', dueDate: '2026-04-30',
          lineItems: [{ id: 3, description: 'Design', qty: 1, unitPrice: 80 }] },
        { id: 4, clientId: 2, status: 'DRAFT', issueDate: '2026-03-01', dueDate: '2026-04-30',
          lineItems: [{ id: 4, description: 'Design', qty: 1, unitPrice: 30 }] },
        { id: 5, clientId: 1, status: 'DRAFT', issueDate: '2026-03-05', dueDate: '2026-04-30', creditOf: 3,
          lineItems: [{ id: 5, description: 'Design', qty: 1, unitPrice: 20 }] },
      ],
    });
    await page.goto('/');

    await page.getByTestId('client-row-1').click();
    await page.getByTestId('invoice-row-1').click();
    await page.getByTestId('line-form-description').fill('Hosting');
    await page.getByTestId('line-form-qty').fill('1');
    await page.getByTestId('line-form-unit-price').fill('25');
    await page.getByTestId('line-form-submit').click();
    // 30.00 + 25.00 = 55.00 is over the minimum
    await expect(page.getByTestId('invoice-minimum-charge')).toHaveText('$0.00');
    await expect(page.getByTestId('invoice-tax')).toHaveText('$4.88'); // 8.875% of 55.00 = 4.88125
    await expect(page.getByTestId('invoice-grand-total')).toHaveText('$59.88');
  });
});
