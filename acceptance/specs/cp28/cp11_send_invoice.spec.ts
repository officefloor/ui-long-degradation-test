import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';
import { auditLines } from '../support/audit';

// UPDATED for cp28 (mutates: [11]): sending now moves the issue date to the send date and works the
// due date out again (end of the following month), so the sent invoice shows 2026-03-05 / 2026-04-30
// instead of keeping 2026-02-10 / 2026-03-31. Carries all three tests from the version in force (a
// sent invoice with a payment stays locked).
// Sending a draft makes it Sent, moves its issue date to today and its due date to the last day of
// the following month, and writes the audit line
// INVOICE_SENT id=<id> number=<number> total=<grand total>. An invoice with no lines cannot be sent.
// Once a sent invoice has a payment its lines and discount are fixed: adding a line or changing the
// discount is refused with an error.
test.describe('send invoice', () => {
  test('sends a draft and records it', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-03-05',
      settings: { taxRate: 10 },
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      invoices: [
        { id: 7, clientId: 1, status: 'DRAFT', issueDate: '2026-02-10', dueDate: '2026-03-31',
          lineItems: [{ id: 1, description: 'Design', qty: 2, unitPrice: 45 }] },
      ],
    });
    await page.goto('/');

    await page.getByTestId('client-row-1').click();
    await page.getByTestId('invoice-row-7').click();
    await page.getByTestId('invoice-send').click();

    await expect(page.getByTestId('invoice-panel-status')).toHaveText('Sent');
    const row = page.getByTestId('invoice-row-7');
    await expect(row.getByTestId('invoice-status')).toHaveText('Sent');
    await expect(row.getByTestId('invoice-issue')).toHaveText('2026-03-05'); // the send date
    await expect(row.getByTestId('invoice-due')).toHaveText('2026-04-30'); // last day of April
    // 2 x 45 = 90.00 + 10% tax 9.00 = 99.00
    await expect.poll(() => auditLines()).toContain('INVOICE_SENT id=7 number=INV-0000075 total=99.00');
  });

  test('refuses to send an invoice with no lines', { tag: '@error' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-03-05',
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      invoices: [{ id: 8, clientId: 1, status: 'DRAFT', issueDate: '2026-03-01', dueDate: '2026-04-30', lineItems: [] }],
    });
    await page.goto('/');

    await page.getByTestId('client-row-1').click();
    await page.getByTestId('invoice-row-8').click();
    await page.getByTestId('invoice-send').click();
    await expect(page.getByTestId('invoice-send-error')).toBeVisible();
    await expect(page.getByTestId('invoice-panel-status')).toHaveText('Draft');
    expect(auditLines().filter((l) => l.startsWith('INVOICE_SENT'))).toEqual([]);
  });

  test('refuses new lines and discount changes on a sent invoice', { tag: '@error' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-03-10',
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      invoices: [
        { id: 9, clientId: 1, status: 'SENT', issueDate: '2026-03-01', dueDate: '2026-04-30',
          lineItems: [{ id: 1, description: 'Design', qty: 1, unitPrice: 50 }] },
      ],
      payments: [{ id: 1, clientId: 1, amount: 10, date: '2026-03-05', allocations: [{ invoiceId: 9, amount: 10 }] }],
    });
    await page.goto('/');

    await page.getByTestId('client-row-1').click();
    await page.getByTestId('invoice-row-9').click();
    await page.getByTestId('line-form-description').fill('Extra');
    await page.getByTestId('line-form-qty').fill('1');
    await page.getByTestId('line-form-unit-price').fill('20');
    await page.getByTestId('line-form-submit').click();
    await expect(page.getByTestId('line-form-error')).toBeVisible();
    await expect(page.getByTestId(/^line-row-\d+$/)).toHaveCount(1);

    await page.getByTestId('discount-form-pct').fill('10');
    await page.getByTestId('discount-form-submit').click();
    await expect(page.getByTestId('discount-form-error')).toBeVisible();
    await expect(page.getByTestId('invoice-discount')).toHaveText('$0.00');
    await expect(page.getByTestId('invoice-subtotal')).toHaveText('$50.00'); // 1 x 50
    await expect(page.getByTestId('invoice-panel-status')).toHaveText('Part paid');
  });
});
