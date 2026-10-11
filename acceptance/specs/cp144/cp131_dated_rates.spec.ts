import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';
import { auditLines } from '../support/audit';

// UPDATED for cp144 (mutates: [115, 131, 135]): a draft is now priced and taxed as of today,
// whatever its date, so the March-dated draft already shows the April rates (210.00 and 252.00)
// before it is sent. Carries the test.
// A rate card or price list entry can take effect from a date (rates[].from); an entry with no date
// has always applied. A line is priced at the entry for its unit type in force on the invoice's
// issue date (the latest one from on or before it), so sending a draft, which makes it issued
// today, prices it at today's rates, and the sent invoice then keeps them.
test.describe('dated rates', () => {
  test('prices a line at the rate in force on the issue date', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-04-10',
      settings: { taxRate: 10 },
      clients: [
        { id: 1, name: 'Acme Ltd', email: 'ops@acme.example',
          rates: [
            { unitType: 'hour', unitPrice: 95 },
            { unitType: 'hour', unitPrice: 105, from: '2026-04-01' },
            { unitType: 'licence', tiers: [{ units: 10, unitPrice: 20 }, { unitPrice: 15 }] },
            { unitType: 'licence', from: '2026-04-01', tiers: [{ units: 10, unitPrice: 22 }, { unitPrice: 16 }] },
          ] },
      ],
      invoices: [
        { id: 1, clientId: 1, status: 'DRAFT', issueDate: '2026-03-20', dueDate: '2026-04-30',
          lineItems: [
            { id: 1, description: 'Consulting', qty: 2, unitType: 'hour' },
            { id: 2, description: 'Licences', qty: 12, unitType: 'licence' },
          ] },
        { id: 2, clientId: 1, status: 'SENT', issueDate: '2026-03-15', dueDate: '2026-04-30',
          lineItems: [{ id: 3, description: 'Consulting', qty: 2, unitType: 'hour' }] },
      ],
    });
    await page.goto('/');

    await page.getByTestId('client-row-1').click();
    await page.getByTestId('invoice-row-1').click();
    // dated 2026-03-20, but a draft is priced at today's rates: 2 x 105.00, and 10 x 22.00 + 2 x 16.00
    await expect(page.getByTestId('line-row-1').getByTestId('line-amount')).toHaveText('$210.00');
    await expect(page.getByTestId('line-row-2').getByTestId('line-amount')).toHaveText('$252.00');
    await page.getByTestId('invoice-send').click();
    // sent today, 2026-04-10: the same rates, now kept
    await expect(page.getByTestId('line-row-1').getByTestId('line-unit-price')).toHaveText('$105.00');
    await expect(page.getByTestId('line-row-1').getByTestId('line-amount')).toHaveText('$210.00');
    await expect(page.getByTestId('line-row-2').getByTestId('line-amount')).toHaveText('$252.00');
    await expect(page.getByTestId('invoice-grand-total')).toHaveText('$508.20'); // (210.00 + 252.00) + 10%
    await expect.poll(() => auditLines()).toContain('INVOICE_SENT id=1 number=INV-0000018 total=508.20');
    // invoice 2 was issued on 2026-03-15 at 95.00 an hour
    await page.getByTestId('invoice-row-2').click();
    await expect(page.getByTestId('invoice-panel-number')).toHaveText(await page.getByTestId('invoice-row-2').getByTestId('invoice-number').innerText());
    await expect(page.getByTestId('line-row-3').getByTestId('line-amount')).toHaveText('$190.00');
  });
});
