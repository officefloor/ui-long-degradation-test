import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';
import { auditLines } from '../support/audit';

// Rebill, on a sent invoice (not void, written off, a credit note or credited), cancels it and
// starts a corrected replacement. It issues a credit note (the next id, dated today,
// CREDIT_NOTE_ISSUED as usual) for exactly what the invoice was sent for, recording the day on the
// invoice (invoices[].rebilledOn), and creates a draft (the id after) for the same client with the
// invoice's lines, percentage discount, surcharge and purchase order, recording which invoice it
// replaces (invoices[].replaces), worked out with today's rules. What had been paid on the invoice
// comes off it and is held as credit for the replacement, used first when the replacement is sent.
// Writes INVOICE_REBILLED from=<number> to=<new number>; each panel shows the other's number. A
// rebilled or fully credited invoice never makes another a possible duplicate. Rebill is refused on
// anything else.
test.describe('credit and rebill', () => {
  test('rebilling cancels an invoice with a full credit note and starts a corrected copy', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-06-10',
      settings: { taxRate: 10, regionTaxRates: { NY: 8.875 }, duplicateDays: 60 },
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example', region: 'NY' }],
      invoices: [
        { id: 1, clientId: 1, status: 'SENT', issueDate: '2026-05-04', dueDate: '2026-06-30',
          sentTotal: 1177.2, sentTax: 97.2,
          lineItems: [
            { id: 1, description: 'Build', qty: 1, unitPrice: 1000 },
            { id: 2, description: 'Hosting', qty: 2, unitPrice: 40 },
          ] },
        { id: 2, clientId: 1, status: 'DRAFT', issueDate: '2026-06-01', dueDate: '2026-06-30',
          lineItems: [{ id: 3, description: 'Design', qty: 1, unitPrice: 100 }] },
      ],
      payments: [
        { id: 1, clientId: 1, amount: 500, date: '2026-05-20', allocations: [{ invoiceId: 1, amount: 500 }] },
      ],
    });
    await page.goto('/');

    await page.getByTestId('client-row-1').click();
    await page.getByTestId('invoice-row-1').click();
    // sent at 9% (1,080.00 + 97.20), part paid
    await expect(page.getByTestId('invoice-amount-due')).toHaveText('$677.20');
    await page.getByTestId('invoice-rebill').click();
    // a credit note for exactly what was sent, which clears it; the 500.00 paid goes back to the client
    // as credit held for the replacement
    await expect.poll(() => auditLines()).toContain('CREDIT_NOTE_ISSUED id=3 number=CN-0000034 invoice=1 total=1177.20');
    await expect.poll(() => auditLines()).toContain('INVOICE_REBILLED from=INV-0000018 to=INV-0000042');
    await expect(page.getByTestId('invoice-row-1').getByTestId('invoice-status')).toHaveText('Credited');
    await expect(page.getByTestId('client-row-1').getByTestId('client-credit')).toHaveText('$500.00');
    await page.getByTestId('invoice-row-1').click();
    await expect(page.getByTestId('invoice-panel-number')).toHaveText(await page.getByTestId('invoice-row-1').getByTestId('invoice-number').innerText());
    await expect(page.getByTestId('invoice-replaced-by')).toHaveText('INV-0000042');
    // the replacement is a draft with the same lines, worked out today at 8.875%: 1,080.00 + 95.85
    await page.getByTestId('invoice-row-4').click();
    await expect(page.getByTestId('invoice-panel-number')).toHaveText(await page.getByTestId('invoice-row-4').getByTestId('invoice-number').innerText());
    await expect(page.getByTestId('invoice-panel-status')).toHaveText('Draft');
    await expect(page.getByTestId('invoice-replaces')).toHaveText('INV-0000018');
    await expect(page.getByTestId('invoice-grand-total')).toHaveText('$1,175.85');
    // the same lines as the invoice it replaces, but that is no duplicate
    await expect(page.getByTestId('invoice-duplicate-of')).toHaveCount(0);
    await expect(page.getByTestId('invoice-approval')).toHaveText('Not needed');
    await page.getByTestId('invoice-send').click();
    await expect(page.getByTestId('invoice-panel-status')).not.toHaveText('Draft');
    // sending it uses the 500.00 held for it first
    await expect.poll(() => auditLines()).toContain('PAYMENT_RECORDED id=1 invoice=4 amount=500.00');
    await expect(page.getByTestId('invoice-amount-due')).toHaveText('$675.85');
    await expect(page.getByTestId('client-row-1').getByTestId('client-balance')).toHaveText('$675.85');
    // a draft can't be rebilled
    await page.getByTestId('invoice-row-2').click();
    await expect(page.getByTestId('invoice-panel-number')).toHaveText(await page.getByTestId('invoice-row-2').getByTestId('invoice-number').innerText());
    await page.getByTestId('invoice-rebill').click();
    await expect(page.getByTestId('invoice-rebill-error')).toBeVisible();
  });
});
