import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';
import { auditLines } from '../support/audit';

// A line can be removed from a draft, or from a sent invoice with no payments (which reopens it as a
// draft, writing INVOICE_REOPENED). The subtotal, discount and its split, tax and totals are worked
// out again. A line can't be removed if what is left would be less than a fixed discount on the
// invoice.
test.describe('remove a line', () => {
  test('removing a line recalculates the discount and tax', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-03-10',
      settings: { taxRate: 10 },
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      invoices: [
        { id: 1, clientId: 1, status: 'DRAFT', issueDate: '2026-03-01', dueDate: '2026-04-30', discountPct: 10,
          lineItems: [
            { id: 1, description: 'Design', qty: 1, unitPrice: 60 },
            { id: 2, description: 'Build', qty: 1, unitPrice: 30 },
            { id: 3, description: 'Hosting', qty: 1, unitPrice: 10.01 },
          ] },
      ],
    });
    await page.goto('/');

    await page.getByTestId('client-row-1').click();
    await page.getByTestId('invoice-row-1').click();
    await expect(page.getByTestId('invoice-subtotal')).toHaveText('$100.01');
    await expect(page.getByTestId('invoice-discount')).toHaveText('$10.00'); // 10% of 100.01 = 10.001 -> 10.00
    // 1000 cents by 6000 : 3000 : 1001 (largest_remainder): 599.94, 299.97, 100.09 -> 600, 300, 100
    await expect(page.getByTestId('line-row-1').getByTestId('line-discount-share')).toHaveText('$6.00');
    await expect(page.getByTestId('line-row-2').getByTestId('line-discount-share')).toHaveText('$3.00');
    await expect(page.getByTestId('line-row-3').getByTestId('line-discount-share')).toHaveText('$1.00');
    await expect(page.getByTestId('invoice-tax')).toHaveText('$9.00'); // 5.40 + 2.70 + 0.90 (10% of 9.01 = 0.901)
    await expect(page.getByTestId('invoice-grand-total')).toHaveText('$99.01'); // 100.01 - 10.00 + 9.00

    await page.getByTestId('line-row-3').getByTestId('line-remove').click();
    await expect(page.getByTestId('line-row-3')).toHaveCount(0);
    await expect(page.getByTestId('invoice-subtotal')).toHaveText('$90.00'); // 60.00 + 30.00
    await expect(page.getByTestId('invoice-discount')).toHaveText('$9.00'); // 10% of 90.00
    await expect(page.getByTestId('line-row-1').getByTestId('line-discount-share')).toHaveText('$6.00'); // 9.00 x 60/90
    await expect(page.getByTestId('line-row-2').getByTestId('line-discount-share')).toHaveText('$3.00'); // 9.00 x 30/90
    await expect(page.getByTestId('invoice-tax')).toHaveText('$8.10'); // 10% of 54.00 + 10% of 27.00
    await expect(page.getByTestId('invoice-grand-total')).toHaveText('$89.10'); // 90.00 - 9.00 + 8.10
    await expect(page.getByTestId('invoice-row-1').getByTestId('invoice-total')).toHaveText('$89.10');
  });

  test('refuses to remove a line below a fixed discount', { tag: '@error' }, async ({ page }) => {
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
    // Removing the 60.00 line would leave 10.00, less than the 14.00 discount.
    await page.getByTestId('line-row-1').getByTestId('line-remove').click();
    await expect(page.getByTestId('line-form-error')).toBeVisible();
    await expect(page.getByTestId(/^line-row-\d+$/)).toHaveCount(2);
    await expect(page.getByTestId('invoice-subtotal')).toHaveText('$70.00');
    await expect(page.getByTestId('invoice-discount')).toHaveText('$14.00');
  });

  test('removing a line from an unpaid sent invoice reopens it', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-03-10',
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      invoices: [
        { id: 3, clientId: 1, status: 'SENT', issueDate: '2026-03-01', dueDate: '2026-04-30',
          lineItems: [
            { id: 1, description: 'Design', qty: 1, unitPrice: 40 },
            { id: 2, description: 'Extras', qty: 1, unitPrice: 10 },
          ] },
      ],
    });
    await page.goto('/');

    await page.getByTestId('client-row-1').click();
    await page.getByTestId('invoice-row-3').click();
    await page.getByTestId('line-row-2').getByTestId('line-remove').click();
    await expect(page.getByTestId('invoice-subtotal')).toHaveText('$40.00');
    await expect(page.getByTestId('invoice-panel-status')).toHaveText('Draft');
    await expect.poll(() => auditLines()).toContain('INVOICE_REOPENED id=3');
  });
});
