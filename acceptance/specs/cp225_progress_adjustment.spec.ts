import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';
import { auditLines } from '../support/audit';

// Changing the percent complete of a line on a sent invoice issues an adjustment note for the
// change: a line with the line's description and the difference between the new and the old
// percentage's amounts (each the percentage of the line's full amount rounded half up on its own;
// what was billed before is unchanged), billed on a debit note or, when lower, taken off on a
// credit note, priced and taxed like the invoice's lines. The invoice's own line keeps the percent
// it was sent with.
test.describe('progress changed after sending', () => {
  test("changing a sent line's percent complete bills the difference", { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-06-10',
      settings: { taxRate: 10 },
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      invoices: [
        { id: 1, clientId: 1, status: 'SENT', issueDate: '2026-05-15', dueDate: '2026-06-30',
          lineItems: [
            { id: 1, description: 'Build phase', qty: 1, unitPrice: 1234.57, percentComplete: 40, billedPct: 15 },
            { id: 2, description: 'Design', qty: 1, unitPrice: 200 },
          ] },
      ],
    });
    await page.goto('/');

    await page.getByTestId('client-row-1').click();
    await page.getByTestId('invoice-row-1').click();
    // 40% of 1,234.57 = 493.828 -> 493.83, less the 15% billed before, 185.1855 -> 185.19
    await expect(page.getByTestId('line-row-1').getByTestId('line-amount')).toHaveText('$308.64');
    await expect(page.getByTestId('line-row-1').getByTestId('line-billed-pct')).toHaveText('15%');
    await page.getByTestId('line-row-1').getByTestId('line-edit').click();
    await page.getByTestId('line-form-percent').fill('55');
    await page.getByTestId('line-form-submit').click();
    // 55% = 679.0135 -> 679.01; 679.01 - 493.83 = 185.18 more is billed on a debit note (not 15% of
    // 1,234.57, 185.19), plus 10% tax
    await expect.poll(() => auditLines()).toContain('ADJUSTMENT_ISSUED id=2 number=ADJ-0000026 invoice=1 total=203.70');
    await expect(page.getByTestId('invoice-row-2').getByTestId('invoice-total')).toHaveText('$203.70');
    await expect(page.getByTestId('line-row-1').getByTestId('line-percent')).toHaveText('40%');
    await expect(page.getByTestId('client-row-1').getByTestId('client-balance')).toHaveText('$763.20');
  });

  test('a lower percent complete is credited', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-06-10',
      settings: { taxRate: 10 },
      clients: [{ id: 2, name: 'Globex Corp', email: 'billing@globex.example' }],
      invoices: [
        { id: 3, clientId: 2, status: 'SENT', issueDate: '2026-05-15', dueDate: '2026-06-30',
          lineItems: [{ id: 3, description: 'Build phase', qty: 1, unitPrice: 2000, percentComplete: 60 }] },
      ],
    });
    await page.goto('/');

    await page.getByTestId('client-row-2').click();
    await page.getByTestId('invoice-row-3').click();
    await page.getByTestId('line-row-3').getByTestId('line-edit').click();
    await page.getByTestId('line-form-percent').fill('45');
    await page.getByTestId('line-form-submit').click();
    // 60% down to 45% of 2,000.00: 300.00 and its 30.00 tax come off on a credit note
    await expect.poll(() => auditLines()).toContain('ADJUSTMENT_ISSUED id=4 number=ADJ-0000042 invoice=3 total=-330.00');
    await expect(page.getByTestId('invoice-amount-due')).toHaveText('$990.00');
  });
});
