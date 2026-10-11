import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';
import { auditLines } from '../support/audit';

// A sent invoice with no payments can still be changed: adding a line or changing the discount puts
// it back to Draft (to be sent again) and writes INVOICE_REOPENED id=<id>. Once any payment has been
// recorded against it, changes are refused with an error.
test.describe('reopen a sent invoice', () => {
  test('changing an unpaid sent invoice puts it back to draft', { tag: '@core' }, async ({ page }) => {
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
    await expect(page.getByTestId('line-row-3').getByTestId('line-amount')).toHaveText('$20.00');
    await expect(page.getByTestId('invoice-subtotal')).toHaveText('$120.00'); // 100.00 + 20.00
    await expect(page.getByTestId('invoice-panel-status')).toHaveText('Draft');
    await expect(page.getByTestId('invoice-row-5').getByTestId('invoice-status')).toHaveText('Draft');
    await expect.poll(() => auditLines()).toContain('INVOICE_REOPENED id=5');

    await page.getByTestId('invoice-row-6').click();
    await page.getByTestId('discount-form-pct').fill('10');
    await page.getByTestId('discount-form-submit').click();
    await expect(page.getByTestId('invoice-discount')).toHaveText('$8.00'); // 10% of 80.00
    await expect(page.getByTestId('invoice-grand-total')).toHaveText('$72.00'); // 80.00 - 8.00
    await expect(page.getByTestId('invoice-panel-status')).toHaveText('Draft');
    await expect.poll(() => auditLines()).toContain('INVOICE_REOPENED id=6');
  });

  test('an invoice with a payment stays fixed', { tag: '@error' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-03-10',
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      invoices: [
        { id: 7, clientId: 1, status: 'SENT', issueDate: '2026-03-01', dueDate: '2026-04-30',
          lineItems: [{ id: 1, description: 'Design', qty: 1, unitPrice: 100 }] },
      ],
      payments: [{ id: 1, clientId: 1, amount: 30, date: '2026-03-05', allocations: [{ invoiceId: 7, amount: 30 }] }],
    });
    await page.goto('/');

    await page.getByTestId('client-row-1').click();
    await page.getByTestId('invoice-row-7').click();
    await page.getByTestId('line-form-description').fill('Extra pages');
    await page.getByTestId('line-form-qty').fill('1');
    await page.getByTestId('line-form-unit-price').fill('20');
    await page.getByTestId('line-form-submit').click();
    await expect(page.getByTestId('line-form-error')).toBeVisible();
    await expect(page.getByTestId(/^line-row-\d+$/)).toHaveCount(1);
    await page.getByTestId('discount-form-pct').fill('10');
    await page.getByTestId('discount-form-submit').click();
    await expect(page.getByTestId('discount-form-error')).toBeVisible();
    await expect(page.getByTestId('invoice-discount')).toHaveText('$0.00');
    await expect(page.getByTestId('invoice-subtotal')).toHaveText('$100.00');
    await expect(page.getByTestId('invoice-panel-status')).toHaveText('Part paid');
    expect(auditLines().filter((l) => l.startsWith('INVOICE_REOPENED'))).toEqual([]);
  });
});
