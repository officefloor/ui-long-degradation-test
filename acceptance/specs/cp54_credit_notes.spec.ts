import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';
import { auditLines } from '../support/audit';

// A sent invoice can be credited: the Credit note button creates a draft credit note for it (an
// invoice with invoices[].creditOf naming the original), the next invoice id, numbered CN- with the
// six-digit id and its Luhn digit, and opens it. Its lines are added like any draft; it has no
// discount and is taxed like the original. Its total is negative in the invoice list. Sending it
// issues it: status Credit note, CREDIT_NOTE_ISSUED id=<id> number=<CN number> invoice=<original
// id> total=<grand total> (no INVOICE_SENT), and its total comes off the original's amount due,
// shown on the original as Credited. A credit note for more than the original still owes is
// refused. An original cleared by credit notes with nothing paid is Credited. An invoice with an
// issued credit note can no longer be changed, reopened or voided.
test.describe('credit notes', () => {
  test('issues a credit note against a part-paid invoice', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-03-10',
      settings: { taxRate: 10 },
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      invoices: [
        { id: 3, clientId: 1, status: 'SENT', issueDate: '2026-03-01', dueDate: '2026-04-30',
          lineItems: [{ id: 1, description: 'Extras', qty: 1, unitPrice: 20 }] },
        { id: 9, clientId: 1, status: 'SENT', issueDate: '2026-03-01', dueDate: '2026-04-30',
          lineItems: [
            { id: 2, description: 'Design', qty: 2, unitPrice: 45 },
            { id: 3, description: 'Hosting', qty: 1, unitPrice: 20, taxExempt: true },
          ] },
      ],
      payments: [
        { id: 1, clientId: 1, amount: 30, date: '2026-03-05', allocations: [{ invoiceId: 9, amount: 30 }] },
      ],
    });
    await page.goto('/');

    await page.getByTestId('client-row-1').click();
    await page.getByTestId('invoice-row-9').click();
    await page.getByTestId('invoice-credit').click();
    // a new draft credit note, the next invoice id (10), numbered CN- with its Luhn digit
    await expect(page.getByTestId('invoice-panel-number')).toHaveText('CN-0000109');
    await expect(page.getByTestId('invoice-panel-status')).toHaveText('Draft');
    await page.getByTestId('line-form-description').fill('Design');
    await page.getByTestId('line-form-qty').fill('1');
    await page.getByTestId('line-form-unit-price').fill('45');
    await page.getByTestId('line-form-submit').click();
    await expect(page.getByTestId('invoice-subtotal')).toHaveText('$45.00');
    await expect(page.getByTestId('invoice-tax')).toHaveText('$4.50'); // 10% of 45.00
    await expect(page.getByTestId('invoice-grand-total')).toHaveText('$49.50');
    await expect(page.getByTestId('invoice-row-10').getByTestId('invoice-total')).toHaveText('-$49.50');

    await page.getByTestId('invoice-send').click();
    await expect(page.getByTestId('invoice-panel-status')).toHaveText('Credit note');
    await expect.poll(() => auditLines()).toContain('CREDIT_NOTE_ISSUED id=10 number=CN-0000109 invoice=9 total=49.50');
    expect(auditLines().filter((l) => l.startsWith('INVOICE_SENT'))).toEqual([]);

    // invoice 9: 90.00 + 20.00 exempt + 9.00 tax = 119.00, less 30.00 paid and 49.50 credited
    await page.getByTestId('invoice-row-9').click();
    await expect(page.getByTestId('invoice-panel-number')).toHaveText(await page.getByTestId('invoice-row-9').getByTestId('invoice-number').innerText());
    await expect(page.getByTestId('invoice-credited')).toHaveText('$49.50');
    await expect(page.getByTestId('invoice-amount-due')).toHaveText('$39.50');
    await expect(page.getByTestId('invoice-panel-status')).toHaveText('Part paid');
    // 22.00 (invoice 3) + 39.50; the credit note itself does not count
    await expect(page.getByTestId('client-row-1').getByTestId('client-balance')).toHaveText('$61.50');
  });

  test('refuses a credit note for more than the invoice still owes', { tag: '@error' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-03-10',
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      invoices: [
        { id: 4, clientId: 1, status: 'SENT', issueDate: '2026-03-01', dueDate: '2026-04-30',
          lineItems: [{ id: 1, description: 'Design', qty: 1, unitPrice: 60 }] },
        { id: 11, clientId: 1, status: 'DRAFT', issueDate: '2026-03-05', dueDate: '2026-04-30', creditOf: 4,
          lineItems: [{ id: 2, description: 'Design', qty: 1, unitPrice: 45 }] },
      ],
      payments: [
        { id: 2, clientId: 1, amount: 20, date: '2026-03-05', allocations: [{ invoiceId: 4, amount: 20 }] },
      ],
    });
    await page.goto('/');

    await page.getByTestId('client-row-1').click();
    await page.getByTestId('invoice-row-11').click();
    // 45.00 against the 40.00 invoice 4 still owes (60.00 - 20.00)
    await page.getByTestId('invoice-send').click();
    await expect(page.getByTestId('invoice-send-error')).toBeVisible();
    await expect(page.getByTestId('invoice-panel-status')).toHaveText('Draft');
    await page.getByTestId('invoice-row-4').click();
    await expect(page.getByTestId('invoice-panel-number')).toHaveText(await page.getByTestId('invoice-row-4').getByTestId('invoice-number').innerText());
    await expect(page.getByTestId('invoice-credited')).toHaveText('$0.00');
    await expect(page.getByTestId('invoice-amount-due')).toHaveText('$40.00');
    expect(auditLines().filter((l) => l.startsWith('CREDIT_NOTE_ISSUED'))).toEqual([]);
  });

  test('a fully credited invoice is Credited and can no longer change', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-03-10',
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      invoices: [
        { id: 5, clientId: 1, status: 'SENT', issueDate: '2026-03-01', dueDate: '2026-04-30',
          lineItems: [{ id: 1, description: 'Design', qty: 1, unitPrice: 60 }] },
        { id: 12, clientId: 1, status: 'DRAFT', issueDate: '2026-03-05', dueDate: '2026-04-30', creditOf: 5,
          lineItems: [{ id: 2, description: 'Design', qty: 1, unitPrice: 60 }] },
      ],
    });
    await page.goto('/');

    await page.getByTestId('client-row-1').click();
    await page.getByTestId('invoice-row-12').click();
    await page.getByTestId('invoice-send').click();
    await expect(page.getByTestId('invoice-panel-status')).not.toHaveText('Draft');
    await expect(page.getByTestId('invoice-row-5').getByTestId('invoice-status')).toHaveText('Credited');
    await expect(page.getByTestId('client-row-1').getByTestId('client-balance')).toHaveText('$0.00');
    await page.getByTestId('invoice-row-5').click();
    await expect(page.getByTestId('invoice-panel-number')).toHaveText(await page.getByTestId('invoice-row-5').getByTestId('invoice-number').innerText());
    await expect(page.getByTestId('invoice-amount-due')).toHaveText('$0.00'); // 60.00 - 60.00 credited
    // no payments, but the issued credit note keeps it from being reopened or voided
    await page.getByTestId('invoice-void').click();
    await expect(page.getByTestId('invoice-void-error')).toBeVisible();
    await page.getByTestId('line-form-description').fill('Extra');
    await page.getByTestId('line-form-qty').fill('1');
    await page.getByTestId('line-form-unit-price').fill('10');
    await page.getByTestId('line-form-submit').click();
    await expect(page.getByTestId('line-form-error')).toBeVisible();
    await expect(page.getByTestId('invoice-panel-status')).toHaveText('Credited');
    expect(auditLines().filter((l) => l.startsWith('INVOICE_REOPENED') || l.startsWith('INVOICE_VOIDED'))).toEqual([]);
  });
});
