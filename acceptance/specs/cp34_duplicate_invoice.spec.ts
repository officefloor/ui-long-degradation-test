import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';
import { auditLines } from '../support/audit';

// Duplicating the open invoice creates a new draft for the same client, with the next invoice id,
// copies of its lines (with the next line ids, keeping their discounts, rates and exemptions) and
// the same invoice discount, issued today and due at the end of the following month; it opens, and
// INVOICE_DUPLICATED from=<number> to=<new number> is written. Payments are not copied.
test.describe('duplicate an invoice', () => {
  test('duplicates an invoice as a new draft', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-05-20',
      settings: { taxRate: 10 },
      clients: [
        { id: 1, name: 'Acme Ltd', email: 'ops@acme.example' },
        { id: 2, name: 'Globex Corp', email: 'billing@globex.example' },
      ],
      invoices: [
        { id: 7, clientId: 1, status: 'SENT', issueDate: '2026-03-01', dueDate: '2026-04-30', discountPct: 10,
          lineItems: [
            { id: 3, description: 'Design', qty: 2, unitPrice: 45, discountPct: 5 },
            { id: 4, description: 'Hosting', qty: 1, unitPrice: 20, taxExempt: true },
          ] },
        { id: 30, clientId: 2, status: 'SENT', issueDate: '2026-03-01', dueDate: '2026-06-30',
          lineItems: [{ id: 41, description: 'Audit', qty: 1, unitPrice: 100 }] },
      ],
      payments: [{ id: 1, clientId: 1, amount: 50, date: '2026-03-10', allocations: [{ invoiceId: 7, amount: 50 }] }],
    });
    await page.goto('/');

    await page.getByTestId('client-row-1').click();
    await page.getByTestId('invoice-row-7').click();
    await page.getByTestId('invoice-duplicate').click();

    // The highest invoice id is 30 and the highest line id 41.
    await expect(page.getByTestId('invoice-panel-number')).toHaveText('INV-0000315'); // invoice_number_luhn(31)
    await expect(page.getByTestId('invoice-panel-status')).toHaveText('Draft');
    const row = page.getByTestId('invoice-row-31');
    await expect(row.getByTestId('invoice-issue')).toHaveText('2026-05-20');
    await expect(row.getByTestId('invoice-due')).toHaveText('2026-06-30');
    await expect(page.getByTestId('line-row-42').getByTestId('line-description')).toHaveText('Design');
    await expect(page.getByTestId('line-row-42').getByTestId('line-amount')).toHaveText('$85.50'); // 90.00 - 5% (4.50)
    await expect(page.getByTestId('line-row-43').getByTestId('line-amount')).toHaveText('$20.00');
    await expect(page.getByTestId('invoice-subtotal')).toHaveText('$105.50'); // 85.50 + 20.00
    await expect(page.getByTestId('invoice-discount')).toHaveText('$10.55'); // 10% of 105.50
    // shares 8.55 / 2.00 (10.55 x 85.50/105.50 and x 20.00/105.50); tax only on Design: 10% of 77.00
    await expect(page.getByTestId('invoice-tax')).toHaveText('$7.70');
    await expect(page.getByTestId('invoice-grand-total')).toHaveText('$102.65'); // 105.50 - 10.55 + 7.70
    await expect(page.getByTestId('invoice-paid')).toHaveText('$0.00');
    await expect(page.getByTestId('invoice-amount-due')).toHaveText('$102.65');
    await expect(page.getByTestId(/^payment-row-\d+$/)).toHaveCount(0);
    await expect.poll(() => auditLines()).toContain('INVOICE_DUPLICATED from=INV-0000075 to=INV-0000315');
  });
});
