import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';
import { auditLines } from '../support/audit';

// A sent invoice is never reopened. Adding, editing or removing a line of a sent invoice (paid or
// not; not void, written off, a credit note or one with an issued credit note) leaves the invoice
// and its own lines as sent and issues an adjustment note for the change: a new invoice for the
// same client (invoices[].adjustmentOf = the invoice), dated today, numbered ADJ- then the six-
// digit id and its check digit. An added line is billed on a debit note; a removed line is taken
// off by a credit note (the line with its quantity negative); a change of quantity alone is one
// note for the difference; any other edit takes the old line off with a credit note and bills the
// new line on a debit note. A note's lines are priced and taxed like the invoice's (its date,
// region and rules), with no discount or charges of their own. A debit note is sent at once like
// any invoice sent today (due by the usual terms, credit used on it); a credit note comes off what
// the invoice owes, like a credit note, and anything beyond that is held as credit (CREDIT_HELD).
// Each writes ADJUSTMENT_ISSUED id=<id> number=<ADJ-...> invoice=<invoice id> total=<grand total,
// negative for a credit>; the list shows a credit note's total as negative, and the invoice's panel
// shows the sum of its notes as adjusted. A sent invoice's discount can't be changed.
test.describe('adjustment notes', () => {
  test('changing the lines of a sent invoice issues adjustment notes', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-06-10',
      settings: { taxRate: 10 },
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example', termsDays: 30 }],
      invoices: [
        { id: 1, clientId: 1, status: 'SENT', issueDate: '2026-05-15', dueDate: '2026-06-14',
          lineItems: [
            { id: 1, description: 'Design', qty: 4, unitPrice: 120 },
            { id: 2, description: 'Hosting', qty: 1, unitPrice: 80 },
          ] },
      ],
      payments: [
        { id: 1, clientId: 1, amount: 200, date: '2026-05-20', allocations: [{ invoiceId: 1, amount: 200 }] },
      ],
    });
    await page.goto('/');

    await page.getByTestId('client-row-1').click();
    await page.getByTestId('invoice-row-1').click();
    // 480.00 + 80.00 + 10% tax = 616.00, 200.00 paid
    await expect(page.getByTestId('invoice-amount-due')).toHaveText('$416.00');
    await page.getByTestId('line-form-description').fill('Copywriting');
    await page.getByTestId('line-form-qty').fill('2');
    await page.getByTestId('line-form-unit-price').fill('45');
    await page.getByTestId('line-form-submit').click();
    // the invoice stays as sent; the new line is billed on an adjustment note sent at once:
    // 90.00 + 9.00, due 30 days from today
    await expect.poll(() => auditLines()).toContain('ADJUSTMENT_ISSUED id=2 number=ADJ-0000026 invoice=1 total=99.00');
    await expect(page.getByTestId('invoice-panel-status')).toHaveText('Part paid');
    await expect(page.getByTestId(/^line-row-\d+$/)).toHaveCount(2);
    await expect(page.getByTestId('invoice-adjusted')).toHaveText('$99.00');
    await expect(page.getByTestId('invoice-amount-due')).toHaveText('$416.00');
    await expect(page.getByTestId('invoice-row-2').getByTestId('invoice-number')).toHaveText('ADJ-0000026');
    await expect(page.getByTestId('invoice-row-2').getByTestId('invoice-total')).toHaveText('$99.00');
    await expect(page.getByTestId('invoice-row-2').getByTestId('invoice-due')).toHaveText('2026-07-10');
    // four days of design down to three: one note for the day taken off, -120.00 - 12.00, which comes
    // off what the invoice owes
    await page.getByTestId('line-row-1').getByTestId('line-edit').click();
    await page.getByTestId('line-form-qty').fill('3');
    await page.getByTestId('line-form-submit').click();
    await expect.poll(() => auditLines()).toContain('ADJUSTMENT_ISSUED id=3 number=ADJ-0000034 invoice=1 total=-132.00');
    await expect(page.getByTestId('invoice-row-3').getByTestId('invoice-total')).toHaveText('-$132.00');
    await expect(page.getByTestId('invoice-adjusted')).toHaveText('-$33.00'); // 99.00 - 132.00
    await expect(page.getByTestId('invoice-amount-due')).toHaveText('$284.00'); // 416.00 - 132.00
    // removing the hosting takes it off the same way: -80.00 - 8.00
    await page.getByTestId('line-row-2').getByTestId('line-remove').click();
    await expect.poll(() => auditLines()).toContain('ADJUSTMENT_ISSUED id=4 number=ADJ-0000042 invoice=1 total=-88.00');
    await expect(page.getByTestId('invoice-amount-due')).toHaveText('$196.00');
    await expect(page.getByTestId('invoice-grand-total')).toHaveText('$616.00');
    await expect(page.getByTestId('client-row-1').getByTestId('client-balance')).toHaveText('$295.00'); // 196.00 + 99.00
    // the discount of a sent invoice is fixed
    await page.getByTestId('discount-form-pct').fill('10');
    await page.getByTestId('discount-form-submit').click();
    await expect(page.getByTestId('discount-form-error')).toBeVisible();
    expect(auditLines().filter((l) => l.startsWith('INVOICE_REOPENED'))).toEqual([]);
  });

  test('a credit adjustment beyond what is owed becomes credit, and the next note uses it', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-06-10',
      settings: { taxRate: 10 },
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      invoices: [
        { id: 5, clientId: 1, status: 'SENT', issueDate: '2026-05-15', dueDate: '2026-06-30',
          lineItems: [
            { id: 5, description: 'Design', qty: 1, unitPrice: 100 },
            { id: 6, description: 'Travel', qty: 1, unitPrice: 50 },
          ] },
      ],
      payments: [
        { id: 1, clientId: 1, amount: 165, date: '2026-05-20', allocations: [{ invoiceId: 5, amount: 165 }] },
      ],
    });
    await page.goto('/');

    await page.getByTestId('client-row-1').click();
    await page.getByTestId('invoice-row-5').click();
    await page.getByTestId('line-row-6').getByTestId('line-remove').click();
    // the paid invoice owes nothing, so all 55.00 of the note is held as credit
    await expect.poll(() => auditLines()).toContain('ADJUSTMENT_ISSUED id=6 number=ADJ-0000067 invoice=5 total=-55.00');
    await expect.poll(() => auditLines()).toContain('CREDIT_HELD payment=2 amount=55.00');
    await expect(page.getByTestId('client-row-1').getByTestId('client-credit')).toHaveText('$55.00');
    await expect(page.getByTestId('invoice-panel-status')).toHaveText('Paid');
    await page.getByTestId('line-form-description').fill('Taxi');
    await page.getByTestId('line-form-qty').fill('1');
    await page.getByTestId('line-form-unit-price').fill('30');
    await page.getByTestId('line-form-submit').click();
    // the debit note (30.00 + 3.00) is sent like any invoice, so the credit pays it
    await expect.poll(() => auditLines()).toContain('PAYMENT_RECORDED id=2 invoice=7 amount=33.00');
    await expect(page.getByTestId('invoice-row-7').getByTestId('invoice-status')).toHaveText('Paid');
    await expect(page.getByTestId('client-row-1').getByTestId('client-credit')).toHaveText('$22.00');
  });
});
