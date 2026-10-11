import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// A client's prices can include tax (clients[].pricesIncludeTax, a box on the client form). Their
// line amounts, discounts and grand total are then tax-inclusive, and the tax is taken out of them,
// every taxable line at the client's rate (a line's own rate is not used): each line's net is its
// amount after its discount share divided by 1 + the rate, rounded to the cent, and its tax the
// rest; the invoice tax is the total of the taxable lines' amounts after their discount shares
// minus that total divided by 1 + the rate, rounded once, and any cents by which the line taxes
// miss it go one at a time to the lines with the largest amounts (the earlier line on a tie), so
// net + tax is always the line's amount. Exempt lines have no tax inside them. The panel shows the
// amount before tax (invoice-net) and each line its net; retention and the early-payment discount
// are worked out on the amount before tax.
test.describe('prices that include tax', () => {
  test('takes the tax out of prices that include it', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-03-10',
      settings: { taxRate: 10 },
      clients: [
        { id: 1, name: 'Acme Ltd', email: 'ops@acme.example', pricesIncludeTax: true },
        { id: 2, name: 'Globex Corp', email: 'billing@globex.example' },
      ],
      invoices: [
        { id: 1, clientId: 1, status: 'DRAFT', issueDate: '2026-03-01', dueDate: '2026-04-30',
          lineItems: [
            { id: 1, description: 'Design', qty: 1, unitPrice: 10 },
            { id: 2, description: 'Hosting', qty: 1, unitPrice: 5 },
            { id: 3, description: 'Pens', qty: 1, unitPrice: 1.13 },
          ] },
        { id: 2, clientId: 2, status: 'DRAFT', issueDate: '2026-03-01', dueDate: '2026-04-30',
          lineItems: [
            { id: 4, description: 'Design', qty: 1, unitPrice: 10 },
            { id: 5, description: 'Hosting', qty: 1, unitPrice: 5 },
            { id: 6, description: 'Pens', qty: 1, unitPrice: 1.13 },
          ] },
      ],
    });
    await page.goto('/');

    await page.getByTestId('client-row-1').click();
    await page.getByTestId('invoice-row-1').click();
    // the grand total is the prices themselves: 10.00 + 5.00 + 1.13
    await expect(page.getByTestId('invoice-grand-total')).toHaveText('$16.13');
    // the tax inside 16.13 at 10%: 16.13 - 16.13 / 1.1 = 16.13 - 14.66 = 1.47
    await expect(page.getByTestId('invoice-tax')).toHaveText('$1.47');
    await expect(page.getByTestId('invoice-net')).toHaveText('$14.66');
    // per line: 10.00 / 1.1 = 9.09 (tax 0.91), 5.00 / 1.1 = 4.55 (0.45), 1.13 / 1.1 = 1.03 (0.10) is
    // 1.46, a cent short of 1.47: the cent goes to the largest line (10.00), 0.92
    await expect(page.getByTestId('line-row-1').getByTestId('line-tax')).toHaveText('$0.92');
    await expect(page.getByTestId('line-row-2').getByTestId('line-tax')).toHaveText('$0.45');
    await expect(page.getByTestId('line-row-3').getByTestId('line-tax')).toHaveText('$0.10');
    await expect(page.getByTestId('line-row-1').getByTestId('line-net')).toHaveText('$9.08');
    await expect(page.getByTestId('line-row-2').getByTestId('line-net')).toHaveText('$4.55');
    await expect(page.getByTestId('line-row-3').getByTestId('line-net')).toHaveText('$1.03');
    // the same lines for a client whose prices exclude tax: 16.13 + 10%
    await page.getByTestId('client-row-2').click();
    await page.getByTestId('invoice-row-2').click();
    await expect(page.getByTestId('invoice-panel-number')).toHaveText(await page.getByTestId('invoice-row-2').getByTestId('invoice-number').innerText());
    await expect(page.getByTestId('invoice-tax')).toHaveText('$1.61');
    await expect(page.getByTestId('invoice-grand-total')).toHaveText('$17.74');
    await expect(page.getByTestId('invoice-net')).toHaveText('$16.13');
  });

  test('discounts, retention and exempt lines on prices that include tax', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-03-10',
      settings: { taxRate: 10 },
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example', pricesIncludeTax: true }],
      invoices: [
        { id: 2, clientId: 1, status: 'SENT', issueDate: '2026-03-01', dueDate: '2026-04-30', discountPct: 10,
          retentionPct: 10,
          lineItems: [
            { id: 4, description: 'Build', qty: 1, unitPrice: 1100 },
            { id: 5, description: 'Book', qty: 1, unitPrice: 52.5, taxRate: 5 },
            { id: 6, description: 'Postage', qty: 1, unitPrice: 4.99, taxExempt: true },
          ] },
      ],
    });
    await page.goto('/');

    await page.getByTestId('client-row-1').click();
    await page.getByTestId('invoice-row-2').click();
    // 1,157.49 less 10% (115.74); the discount is shared over the lines before the tax is taken out;
    // the book's own 5% is not used: every taxable line is at the client's 10%;
    // postage is exempt, so no tax inside it
    await expect(page.getByTestId('invoice-discount')).toHaveText('$115.74');
    await expect(page.getByTestId('invoice-grand-total')).toHaveText('$1,041.75'); // 1,157.49 - 115.74
    await expect(page.getByTestId('invoice-tax')).toHaveText('$94.30');
    await expect(page.getByTestId('line-row-4').getByTestId('line-tax')).toHaveText('$90.00');
    await expect(page.getByTestId('line-row-5').getByTestId('line-tax')).toHaveText('$4.30');
    await expect(page.getByTestId('line-row-6').getByTestId('line-tax')).toHaveText('$0.00');
    await expect(page.getByTestId('invoice-net')).toHaveText('$947.45');
    // retention is 10% of the amount before tax, rounded down
    await expect(page.getByTestId('invoice-retention')).toHaveText('$94.74');
    await expect(page.getByTestId('invoice-amount-due')).toHaveText('$947.01');
  });

  test('adds a client whose prices include tax', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-03-10',
      settings: { taxRate: 10 },
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
    });
    await page.goto('/');

    await page.getByTestId('client-form-name').fill('Corner Shop');
    await page.getByTestId('client-form-email').fill('till@corner.example');
    await page.getByTestId('client-form-prices-include-tax').check();
    await page.getByTestId('client-form-submit').click();
    await page.getByTestId('client-row-2').click();
    await page.getByTestId('invoice-new').click();
    await page.getByTestId('line-form-description').fill('Design');
    await page.getByTestId('line-form-qty').fill('1');
    await page.getByTestId('line-form-unit-price').fill('110');
    await page.getByTestId('line-form-submit').click();
    await expect(page.getByTestId('invoice-grand-total')).toHaveText('$110.00');
    await expect(page.getByTestId('invoice-tax')).toHaveText('$10.00'); // 110.00 - 110.00 / 1.1
    await expect(page.getByTestId('invoice-net')).toHaveText('$100.00');
  });
});
