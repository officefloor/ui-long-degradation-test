import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';
import { auditLines } from '../support/audit';

// A tiered unit type's bands count the client's whole month: units of it already billed on the
// client's other sent invoices issued earlier in the same calendar month (on the same date, the
// lower invoice id first) come first, and the invoice's own lines carry on through the bands from
// there. Drafts, void invoices and credit notes don't count; sending a draft dates it today.
test.describe('volume across the month', () => {
  test('counts the units already billed to the client this month', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-03-10',
      settings: { taxRate: 10 },
      clients: [
        { id: 1, name: 'Acme Ltd', email: 'ops@acme.example',
          rates: [
            { unitType: 'licence', tiers: [{ units: 10, unitPrice: 20 }, { units: 40, unitPrice: 15 }, { unitPrice: 12 }] },
            { unitType: 'hour', unitPrice: 95 },
          ] },
      ],
      invoices: [
        { id: 1, clientId: 1, status: 'SENT', issueDate: '2026-03-02', dueDate: '2026-04-30',
          lineItems: [{ id: 1, description: 'Licences', qty: 30, unitType: 'licence' }] },
        { id: 2, clientId: 1, status: 'DRAFT', issueDate: '2026-03-05', dueDate: '2026-04-30',
          lineItems: [{ id: 2, description: 'Licences', qty: 25, unitType: 'licence' }] },
        { id: 3, clientId: 1, status: 'SENT', issueDate: '2026-02-20', dueDate: '2026-03-31',
          lineItems: [{ id: 3, description: 'Licences', qty: 40, unitType: 'licence' }] },
        { id: 4, clientId: 1, status: 'VOID', issueDate: '2026-03-03', dueDate: '2026-04-30',
          lineItems: [{ id: 4, description: 'Licences', qty: 15, unitType: 'licence' }] },
      ],
    });
    await page.goto('/');

    await page.getByTestId('client-row-1').click();
    // invoice 1, the first in March: units 1-30 = 10 x 20.00 + 20 x 15.00
    await page.getByTestId('invoice-row-1').click();
    await expect(page.getByTestId('line-row-1').getByTestId('line-amount')).toHaveText('$500.00');
    // invoice 2 carries on from unit 31: 20 x 15.00 + 5 x 12.00 = 360.00 (on its own it would be 425.00);
    // February's invoice and the void one don't count
    await page.getByTestId('invoice-row-2').click();
    await expect(page.getByTestId('invoice-panel-number')).toHaveText(await page.getByTestId('invoice-row-2').getByTestId('invoice-number').innerText());
    await expect(page.getByTestId('line-row-2').getByTestId('line-amount')).toHaveText('$360.00');
    await expect(page.getByTestId('invoice-grand-total')).toHaveText('$396.00');
    await page.getByTestId('invoice-send').click();
    await expect(page.getByTestId('invoice-panel-status')).not.toHaveText('Draft');
    // sent today, still in March and after invoice 1
    await expect(page.getByTestId('line-row-2').getByTestId('line-amount')).toHaveText('$360.00');
    await expect.poll(() => auditLines()).toContain('INVOICE_SENT id=2 number=INV-0000026 total=396.00');
    // February's 40 licences were priced on their own: 10 x 20.00 + 30 x 15.00
    await page.getByTestId('invoice-row-3').click();
    await expect(page.getByTestId('invoice-panel-number')).toHaveText(await page.getByTestId('invoice-row-3').getByTestId('invoice-number').innerText());
    await expect(page.getByTestId('line-row-3').getByTestId('line-amount')).toHaveText('$650.00');
  });
});
