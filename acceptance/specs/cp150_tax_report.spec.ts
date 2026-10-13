import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';
import { auditLines } from '../support/audit';

// Sending an invoice writes, after INVOICE_SENT, one TAX_CHARGED id=<id> rate=<rate> net=<amount>
// tax=<tax> line for each tax rate on it, lowest rate first: the rate as a plain number, the amount
// before tax of the lines and charges at that rate (after discounts) and the tax worked out for
// that rate. Untaxed lines and charges are reported at rate 0, and a reverse-charged invoice
// reports everything at rate 0. For prices that include tax the amount is the net.
test.describe('tax report on sending', () => {
  test('reports the tax charged at each rate when an invoice is sent', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-03-10',
      settings: { taxRate: 10, regionTaxRates: { NY: 8.875, CA: 7.25, OR: 0 }, homeRegion: 'NY' },
      clients: [
        { id: 1, name: 'Acme Ltd', email: 'ops@acme.example', region: 'NY' },
        { id: 2, name: 'Globex Corp', email: 'billing@globex.example', region: 'CA',
          taxNumber: 'CA2048163017' },
        { id: 3, name: 'Initech', email: 'ap@initech.example', region: 'NY', pricesIncludeTax: true },
      ],
      invoices: [
        { id: 1, clientId: 1, status: 'DRAFT', issueDate: '2026-03-01', dueDate: '2026-04-30',
          surchargePct: 10, discountPct: 5,
          lineItems: [
            { id: 1, description: 'Design', qty: 2, unitPrice: 120 },
            { id: 2, description: 'Handbook', qty: 2, unitPrice: 12.5, taxRate: 5 },
            { id: 3, description: 'Postage', qty: 1, unitPrice: 6.4, taxExempt: true },
          ] },
        { id: 2, clientId: 2, status: 'DRAFT', issueDate: '2026-03-01', dueDate: '2026-04-30',
          lineItems: [{ id: 4, description: 'Design', qty: 2, unitPrice: 120 }] },
        { id: 3, clientId: 3, status: 'DRAFT', issueDate: '2026-03-01', dueDate: '2026-04-30',
          lineItems: [
            { id: 5, description: 'Design', qty: 1, unitPrice: 108.88 },
            { id: 6, description: 'Handbook', qty: 1, unitPrice: 10.5, taxRate: 5 },
          ] },
      ],
    });
    await page.goto('/');

    await page.getByTestId('client-row-1').click();
    await page.getByTestId('invoice-row-1').click();
    await page.getByTestId('invoice-send').click();
    await expect(page.getByTestId('invoice-panel-status')).not.toHaveText('Draft');
    // per rate, after the 5% discount: postage 0%; the handbook 5%; the design and the 10%
    // surcharge at New York's 8.875%
    await expect.poll(() => auditLines().filter((l) => l.startsWith('TAX_CHARGED'))).toEqual([
      'TAX_CHARGED id=1 rate=0 net=6.08 tax=0.00',
      'TAX_CHARGED id=1 rate=5 net=23.75 tax=1.19',
      'TAX_CHARGED id=1 rate=8.875 net=253.78 tax=22.52',
    ]);
    await expect(page.getByTestId('invoice-tax')).toHaveText('$23.71');
    // reverse charged: everything at 0%
    await page.getByTestId('client-row-2').click();
    await page.getByTestId('invoice-row-2').click();
    await expect(page.getByTestId('invoice-panel-number')).toHaveText(await page.getByTestId('invoice-row-2').getByTestId('invoice-number').innerText());
    await page.getByTestId('invoice-send').click();
    await expect(page.getByTestId('invoice-panel-status')).not.toHaveText('Draft');
    await expect.poll(() => auditLines()).toContain('TAX_CHARGED id=2 rate=0 net=240.00 tax=0.00');
    // prices including tax: the net and the tax taken out at each rate
    await page.getByTestId('client-row-3').click();
    await page.getByTestId('invoice-row-3').click();
    await expect(page.getByTestId('invoice-panel-number')).toHaveText(await page.getByTestId('invoice-row-3').getByTestId('invoice-number').innerText());
    await page.getByTestId('invoice-send').click();
    await expect(page.getByTestId('invoice-panel-status')).not.toHaveText('Draft');
    await expect.poll(() => auditLines()).toContain('TAX_CHARGED id=3 rate=5 net=10.00 tax=0.50');
    await expect.poll(() => auditLines()).toContain('TAX_CHARGED id=3 rate=8.875 net=100.00 tax=8.88');
  });
});
