import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';
import { auditLines } from '../support/audit';

// Units added to a sent invoice on a debit note for a unit type priced in bands are priced as the
// next units of the bands, after the invoice's own units of that type (and those billed before it
// that month), exactly as if they had been on the invoice; invoices billed after it don't come in
// between.
test.describe('banded units added after sending', () => {
  test('banded units added to a sent invoice continue its bands', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-06-10',
      settings: {
        taxRate: 10,
        rates: [
          { unitType: 'hour', tiers: [{ units: 10, unitPrice: 100 }, { unitPrice: 90 }] },
        ],
      },
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      invoices: [
        { id: 1, clientId: 1, status: 'SENT', issueDate: '2026-06-01', dueDate: '2026-06-30',
          lineItems: [{ id: 1, description: 'Consulting', qty: 8, unitType: 'hour' }] },
        { id: 2, clientId: 1, status: 'SENT', issueDate: '2026-06-01', dueDate: '2026-06-30',
          lineItems: [{ id: 2, description: 'Consulting', qty: 4, unitType: 'hour' }] },
      ],
    });
    await page.goto('/');

    await page.getByTestId('client-row-1').click();
    await page.getByTestId('invoice-row-1').click();
    await expect(page.getByTestId('line-row-1').getByTestId('line-amount')).toHaveText('$800.00'); // 8 x 100.00
    await page.getByTestId('line-form-description').fill('Consulting');
    await page.getByTestId('line-form-unit-type').fill('hour');
    await page.getByTestId('line-form-qty').fill('5');
    await page.getByTestId('line-form-submit').click();
    // hours 9 to 13 of invoice 1: 2 x 100.00 + 3 x 90.00 = 470.00. Not after invoice 2's four hours,
    // billed the same day but after invoice 1 (that would be 5 x 90.00 = 450.00), and not 500.00 as if
    // they were the first five
    await expect.poll(() => auditLines()).toContain('ADJUSTMENT_ISSUED id=3 number=ADJ-0000034 invoice=1 total=517.00');
    await page.getByTestId('invoice-row-3').click();
    await expect(page.getByTestId('line-row-3').getByTestId('line-amount')).toHaveText('$470.00');
    await expect(page.getByTestId('invoice-tax')).toHaveText('$47.00');
  });
});
