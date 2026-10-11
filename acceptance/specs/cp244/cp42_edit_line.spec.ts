import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';
import { auditLines } from '../support/audit';

// UPDATED for cp244 (mutates: [42, 204]): editing a sent line other than its quantity now issues
// one note for the change in its amount, so the price edits give single debit notes of 5.00 and
// 10.00 instead of a credit and a debit note each. Carries the other two tests.
// A line's edit button loads it into the line form; submitting saves the changes to that line
// (same checks as adding one) instead of adding a new line. Everything is worked out again: the
// line's own discount, the subtotal, the invoice discount and its split, each line's tax and the
// totals. Editing a line of a sent invoice, paid or not, issues an adjustment note for the change in
// its amount instead and leaves the invoice as sent; an edit that would leave less than a fixed
// discount is refused.
test.describe('edit a line', () => {
  test('editing a line works the whole invoice out again', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-03-10',
      settings: { taxRate: 10 },
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      invoices: [
        { id: 1, clientId: 1, status: 'DRAFT', issueDate: '2026-03-01', dueDate: '2026-04-30', discountPct: 10,
          lineItems: [
            { id: 1, description: 'Design', qty: 2, unitPrice: 45 },
            { id: 2, description: 'Hosting', qty: 1, unitPrice: 10.01, discountPct: 5 },
            { id: 3, description: 'Postage', qty: 1, unitPrice: 4.99, taxExempt: true },
          ] },
      ],
    });
    await page.goto('/');

    await page.getByTestId('client-row-1').click();
    await page.getByTestId('invoice-row-1').click();
    // 90.00 + (10.01 - 0.50) + 4.99 = 104.50; 10% = 10.45; tax 8.10 + 0.86 = 8.96
    await expect(page.getByTestId('invoice-grand-total')).toHaveText('$103.01'); // 104.50 - 10.45 + 8.96

    await page.getByTestId('line-row-2').getByTestId('line-edit').click();
    await page.getByTestId('line-form-qty').fill('3');
    await page.getByTestId('line-form-submit').click();

    await expect(page.getByTestId(/^line-row-\d+$/)).toHaveCount(3);
    const l2 = page.getByTestId('line-row-2');
    await expect(l2.getByTestId('line-qty')).toHaveText('3');
    await expect(l2.getByTestId('line-discount')).toHaveText('$1.50'); // 5% of (3 x 10.01 = 30.03) = 1.5015 -> 1.50
    await expect(l2.getByTestId('line-amount')).toHaveText('$28.53'); // 30.03 - 1.50
    await expect(page.getByTestId('invoice-subtotal')).toHaveText('$123.52'); // 90.00 + 28.53 + 4.99
    await expect(page.getByTestId('invoice-discount')).toHaveText('$12.35'); // 10% of 123.52 = 12.352 -> 12.35
    // 1235 cents by 9000 : 2853 : 499 (largest_remainder): 899.85, 285.25, 49.89 -> 900, 285, 50
    await expect(page.getByTestId('line-row-1').getByTestId('line-discount-share')).toHaveText('$9.00');
    await expect(l2.getByTestId('line-discount-share')).toHaveText('$2.85');
    await expect(page.getByTestId('line-row-3').getByTestId('line-discount-share')).toHaveText('$0.50');
    await expect(page.getByTestId('line-row-1').getByTestId('line-tax')).toHaveText('$8.10'); // 10% of 81.00
    await expect(l2.getByTestId('line-tax')).toHaveText('$2.57'); // 10% of (28.53 - 2.85 = 25.68) = 2.568 -> 2.57
    await expect(page.getByTestId('invoice-tax')).toHaveText('$10.67'); // 8.10 + 2.57 + 0.00 (exempt)
    await expect(page.getByTestId('invoice-grand-total')).toHaveText('$121.84'); // 123.52 - 12.35 + 10.67
    await expect(page.getByTestId('invoice-row-1').getByTestId('invoice-total')).toHaveText('$121.84');
  });

  test('refuses an edit that breaks a rule', { tag: '@error' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-03-10',
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      invoices: [
        { id: 2, clientId: 1, status: 'DRAFT', issueDate: '2026-03-01', dueDate: '2026-04-30', discountAmount: 14,
          lineItems: [
            { id: 1, description: 'Package', qty: 1, unitPrice: 60 },
            { id: 2, description: 'Extras', qty: 1, unitPrice: 10 },
          ] },
      ],
    });
    await page.goto('/');

    await page.getByTestId('client-row-1').click();
    await page.getByTestId('invoice-row-2').click();
    await page.getByTestId('line-row-1').getByTestId('line-edit').click();
    for (const price of ['3', '0']) { // 3 + 10 = 13.00 is less than the 14.00 discount; 0 is below $0.01
      await page.getByTestId('line-form-unit-price').fill(price);
      await page.getByTestId('line-form-submit').click();
      await expect(page.getByTestId('line-form-error')).toBeVisible();
      await expect(page.getByTestId('invoice-subtotal')).toHaveText('$70.00'); // 60.00 + 10.00
    }
    await page.getByTestId('line-form-unit-price').fill('4');
    await page.getByTestId('line-form-submit').click();
    await expect(page.getByTestId('invoice-subtotal')).toHaveText('$14.00'); // 4.00 + 10.00, equal to the discount
    await expect(page.getByTestId('invoice-grand-total')).toHaveText('$0.00'); // 14.00 - 14.00
  });

  test('editing a line of a sent invoice issues one note for the change', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-03-10',
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      invoices: [
        { id: 3, clientId: 1, status: 'SENT', issueDate: '2026-03-01', dueDate: '2026-04-30',
          lineItems: [{ id: 1, description: 'Design', qty: 1, unitPrice: 40 }] },
        { id: 4, clientId: 1, status: 'SENT', issueDate: '2026-03-01', dueDate: '2026-04-30',
          lineItems: [{ id: 2, description: 'Hosting', qty: 1, unitPrice: 50 }] },
      ],
      payments: [
        { id: 1, clientId: 1, amount: 20, date: '2026-03-05', allocations: [{ invoiceId: 4, amount: 20 }] },
      ],
    });
    await page.goto('/');

    await page.getByTestId('client-row-1').click();
    await page.getByTestId('invoice-row-3').click();
    await page.getByTestId('line-row-1').getByTestId('line-edit').click();
    await page.getByTestId('line-form-unit-price').fill('45');
    await page.getByTestId('line-form-submit').click();
    // a new price: one debit note for the 5.00 more
    await expect.poll(() => auditLines()).toContain('ADJUSTMENT_ISSUED id=5 number=ADJ-0000059 invoice=3 total=5.00');
    await expect(page.getByTestId('invoice-subtotal')).toHaveText('$40.00');
    await expect(page.getByTestId('invoice-adjusted')).toHaveText('$5.00');
    await expect(page.getByTestId('invoice-panel-status')).toHaveText('Sent');
    // the part-paid invoice: one debit note for the 10.00 more; the 20.00 paid stays on the invoice
    await page.getByTestId('invoice-row-4').click();
    await expect(page.getByTestId('invoice-panel-number')).toHaveText(await page.getByTestId('invoice-row-4').getByTestId('invoice-number').innerText());
    await page.getByTestId('line-row-2').getByTestId('line-edit').click();
    await page.getByTestId('line-form-unit-price').fill('60');
    await page.getByTestId('line-form-submit').click();
    await expect.poll(() => auditLines()).toContain('ADJUSTMENT_ISSUED id=6 number=ADJ-0000067 invoice=4 total=10.00');
    await expect(page.getByTestId('invoice-panel-status')).toHaveText('Part paid');
    await expect(page.getByTestId('invoice-amount-due')).toHaveText('$30.00');
    expect(auditLines().filter((l) => l.startsWith('CREDIT_HELD') || l.startsWith('INVOICE_REOPENED'))).toEqual([]);
  });
});
