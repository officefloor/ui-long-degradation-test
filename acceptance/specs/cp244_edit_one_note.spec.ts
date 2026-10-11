import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';
import { auditLines } from '../support/audit';

// Any edit of a sent line other than a change of quantity alone is now one adjustment note for the
// change in the line's amount: a line with the line's description, quantity 1 (or -1 when the
// amount went down, on a credit note) and the difference as its price, keeping the line's tax rate
// or exemption. A change of quantity alone is still one note for the difference in quantity.
test.describe('an edit is one note', () => {
  test('editing a sent line issues one note for the change in its amount', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-06-10',
      settings: { taxRate: 10 },
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      invoices: [
        { id: 1, clientId: 1, status: 'SENT', issueDate: '2026-05-15', dueDate: '2026-06-30',
          lineItems: [
            { id: 1, description: 'Design', qty: 3, unitPrice: 33.33 },
            { id: 2, description: 'Hosting', qty: 1, unitPrice: 80, taxExempt: true },
          ] },
      ],
    });
    await page.goto('/');

    await page.getByTestId('client-row-1').click();
    await page.getByTestId('invoice-row-1').click();
    await page.getByTestId('line-row-1').getByTestId('line-edit').click();
    await page.getByTestId('line-form-unit-price').fill('36.67');
    await page.getByTestId('line-form-submit').click();
    // 3 x 33.33 = 99.99 becomes 3 x 36.67 = 110.01: one debit note for 10.02, taxed 1.00 (10% of 10.02),
    // not 99.99 off and 110.01 back on (10.00 and 11.00 of tax)
    await expect.poll(() => auditLines()).toContain('ADJUSTMENT_ISSUED id=2 number=ADJ-0000026 invoice=1 total=11.02');
    expect(auditLines().filter((l) => l.startsWith('ADJUSTMENT_ISSUED'))).toHaveLength(1);
    await page.getByTestId('invoice-row-2').click();
    await expect(page.getByTestId('line-row-3').getByTestId('line-amount')).toHaveText('$10.02');
    await expect(page.getByTestId('invoice-tax')).toHaveText('$1.00');
    // an untaxed line edited: 80.00 becomes 2 x 70.00 = 140.00, a debit note for 60.00 with no tax
    await page.getByTestId('invoice-row-1').click();
    await page.getByTestId('line-row-2').getByTestId('line-edit').click();
    await page.getByTestId('line-form-qty').fill('2');
    await page.getByTestId('line-form-unit-price').fill('70');
    await page.getByTestId('line-form-submit').click();
    await expect.poll(() => auditLines()).toContain('ADJUSTMENT_ISSUED id=3 number=ADJ-0000034 invoice=1 total=60.00');
    await expect(page.getByTestId('invoice-adjusted')).toHaveText('$71.02');
    await expect(page.getByTestId('client-row-1').getByTestId('client-balance')).toHaveText('$261.01');
  });
});
