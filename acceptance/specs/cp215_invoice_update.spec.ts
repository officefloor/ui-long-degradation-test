import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';
import { auditLines } from '../support/audit';

// Update, on a sent invoice whose current total differs from the total it was sent with, makes
// today's figures its sent figures (grand total and tax), so it owes what today's rules give, and
// writes INVOICE_UPDATED id=<id> from=<old total> to=<new total>. It is refused when there is no
// difference, when the new total is less than what has already been paid on the invoice, and when
// an increase would take the client over its credit limit.
test.describe('bringing a sent invoice up to date', () => {
  test("updating a sent invoice takes today's figures", { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-06-10',
      settings: { taxRate: 10, regionTaxRates: { NY: 8.875 } },
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example', region: 'NY', withholdingPct: 10 }],
      invoices: [
        { id: 1, clientId: 1, status: 'SENT', issueDate: '2026-05-04', dueDate: '2026-06-30', sentTotal: 545,
          sentTax: 45,
          lineItems: [{ id: 1, description: 'Design', qty: 1, unitPrice: 500 }] },
      ],
    });
    await page.goto('/');

    await page.getByTestId('client-row-1').click();
    await page.getByTestId('invoice-row-1').click();
    // sent at 9%; New York's rate is 8.875% now
    await expect(page.getByTestId('invoice-current-total')).toHaveText('$544.38');
    await expect(page.getByTestId('invoice-amount-due')).toHaveText('$495.00'); // 545.00 - 50.00 withheld
    await page.getByTestId('invoice-update').click();
    await expect.poll(() => auditLines()).toContain('INVOICE_UPDATED id=1 from=545.00 to=544.38');
    await expect(page.getByTestId('invoice-sent-total')).toHaveText('$544.38');
    await expect(page.getByTestId('invoice-tax')).toHaveText('$44.38');
    await expect(page.getByTestId('invoice-current-total')).toHaveCount(0);
    await expect(page.getByTestId('invoice-amount-due')).toHaveText('$494.38');
    // nothing more to update
    await page.getByTestId('invoice-update').click();
    await expect(page.getByTestId('invoice-update-error')).toBeVisible();
  });

  test('an update that would take the client over its credit limit is refused', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-06-10',
      settings: { taxRate: 10, regionTaxRates: { NY: 8.875 } },
      clients: [
        { id: 2, name: 'Globex Corp', email: 'billing@globex.example', region: 'NY', creditLimit: 1190 },
      ],
      invoices: [
        { id: 2, clientId: 2, status: 'SENT', issueDate: '2026-05-04', dueDate: '2026-06-30', sentTotal: 1080,
          sentTax: 80,
          lineItems: [{ id: 2, description: 'Build', qty: 1, unitPrice: 1000 }] },
        { id: 3, clientId: 2, status: 'SENT', issueDate: '2026-05-04', dueDate: '2026-06-30', sentTotal: 108,
          sentTax: 8,
          lineItems: [{ id: 3, description: 'Hosting', qty: 1, unitPrice: 100 }] },
      ],
    });
    await page.goto('/');

    await page.getByTestId('client-row-2').click();
    // 1,080.00 + 108.00 = 1,188.00 owed of the 1,190.00 limit
    await expect(page.getByTestId('client-row-2').getByTestId('client-available')).toHaveText('$2.00');
    // today's 1,088.75 would take the client to 1,196.75
    await page.getByTestId('invoice-row-2').click();
    await expect(page.getByTestId('invoice-current-total')).toHaveText('$1,088.75');
    await page.getByTestId('invoice-update').click();
    await expect(page.getByTestId('invoice-update-error')).toBeVisible();
    await expect(page.getByTestId('invoice-sent-total')).toHaveText('$1,080.00');
    // 108.88 for the hosting fits: 1,188.88
    await page.getByTestId('invoice-row-3').click();
    await expect(page.getByTestId('invoice-panel-number')).toHaveText(await page.getByTestId('invoice-row-3').getByTestId('invoice-number').innerText());
    await page.getByTestId('invoice-update').click();
    await expect(page.getByTestId('invoice-sent-total')).toHaveText('$108.88');
    await expect(page.getByTestId('client-row-2').getByTestId('client-available')).toHaveText('$1.12');
  });
});
