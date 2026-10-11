import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';
import { auditLines } from '../support/audit';

// UPDATED for cp204 (mutates: [11, 16, 31, 42, 201]): a sent invoice is no longer reopened; a line
// added to a sent invoice, paid or not, is billed on an adjustment note and the invoice stays as
// sent, and a sent invoice's discount is always fixed. Both tests are replaced by tests of that.
// Carries neither earlier test.
// A line added to a sent invoice, paid or not, is billed on an adjustment note (ADJUSTMENT_ISSUED);
// the invoice stays as sent. A sent invoice's discount can't be changed.
test.describe('reopen a sent invoice', () => {
  test('a line added to a sent invoice is billed on an adjustment note', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-03-10',
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      invoices: [
        { id: 5, clientId: 1, status: 'SENT', issueDate: '2026-03-01', dueDate: '2026-04-30',
          lineItems: [{ id: 1, description: 'Design', qty: 1, unitPrice: 100 }] },
        { id: 6, clientId: 1, status: 'SENT', issueDate: '2026-03-01', dueDate: '2026-04-30',
          lineItems: [{ id: 2, description: 'Hosting', qty: 1, unitPrice: 80 }] },
      ],
    });
    await page.goto('/');

    await page.getByTestId('client-row-1').click();
    await page.getByTestId('invoice-row-5').click();
    await page.getByTestId('line-form-description').fill('Extra pages');
    await page.getByTestId('line-form-qty').fill('1');
    await page.getByTestId('line-form-unit-price').fill('20');
    await page.getByTestId('line-form-submit').click();
    // the invoice stays sent with its one line; the 20.00 goes on adjustment note 7
    await expect(page.getByTestId('invoice-subtotal')).toHaveText('$100.00');
    await expect(page.getByTestId('invoice-panel-status')).toHaveText('Sent');
    await expect(page.getByTestId('invoice-adjusted')).toHaveText('$20.00');
    await expect.poll(() => auditLines()).toContain('ADJUSTMENT_ISSUED id=7 number=ADJ-0000075 invoice=5 total=20.00');
    await expect(page.getByTestId('invoice-row-7').getByTestId('invoice-total')).toHaveText('$20.00');
    // a sent invoice's discount can't be changed
    await page.getByTestId('invoice-row-6').click();
    await expect(page.getByTestId('invoice-panel-number')).toHaveText(await page.getByTestId('invoice-row-6').getByTestId('invoice-number').innerText());
    await page.getByTestId('discount-form-pct').fill('10');
    await page.getByTestId('discount-form-submit').click();
    await expect(page.getByTestId('discount-form-error')).toBeVisible();
    await expect(page.getByTestId('invoice-discount')).toHaveText('$0.00');
    await expect(page.getByTestId('invoice-panel-status')).toHaveText('Sent');
    expect(auditLines().filter((l) => l.startsWith('INVOICE_REOPENED'))).toEqual([]);
  });

  test('a part-paid invoice takes adjustment notes too', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-03-10',
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      invoices: [
        { id: 7, clientId: 1, status: 'SENT', issueDate: '2026-03-01', dueDate: '2026-04-30',
          lineItems: [{ id: 1, description: 'Design', qty: 1, unitPrice: 100 }] },
      ],
      payments: [
        { id: 1, clientId: 1, amount: 30, date: '2026-03-05', allocations: [{ invoiceId: 7, amount: 30 }] },
      ],
    });
    await page.goto('/');

    await page.getByTestId('client-row-1').click();
    await page.getByTestId('invoice-row-7').click();
    await page.getByTestId('line-form-description').fill('Extra pages');
    await page.getByTestId('line-form-qty').fill('1');
    await page.getByTestId('line-form-unit-price').fill('20');
    await page.getByTestId('line-form-submit').click();
    await expect.poll(() => auditLines()).toContain('ADJUSTMENT_ISSUED id=8 number=ADJ-0000083 invoice=7 total=20.00');
    await expect(page.getByTestId(/^line-row-\d+$/)).toHaveCount(1);
    await expect(page.getByTestId('invoice-subtotal')).toHaveText('$100.00');
    await expect(page.getByTestId('invoice-panel-status')).toHaveText('Part paid');
    await expect(page.getByTestId('invoice-row-8').getByTestId('invoice-status')).toHaveText('Sent');
    await page.getByTestId('discount-form-pct').fill('10');
    await page.getByTestId('discount-form-submit').click();
    await expect(page.getByTestId('discount-form-error')).toBeVisible();
    await expect(page.getByTestId('invoice-discount')).toHaveText('$0.00');
  });
});
