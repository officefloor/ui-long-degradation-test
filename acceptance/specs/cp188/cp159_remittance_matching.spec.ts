import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';
import { auditLines } from '../support/audit';

// UPDATED for cp188 (mutates: [22, 24, 50, 64, 81, 159]): after overdue invoices a payment now pays
// the smallest amount due first, so the unmatched 500.00 pays invoice 1 (400.00) before invoice 2
// (40.00) instead of 440.00 on invoice 2. Carries both tests.
// An invoice can carry the client's purchase order number (invoices[].poNumber; the panel's PO box,
// shown on the panel). The payment form takes remittance text (payments[].remittance). A payment
// with remittance text and no open invoice or reference first pays the client's open invoice whose
// purchase order number is most like the text, by Jaro-Winkler similarity on the lower-cased
// strings (matching window half the longer length less one, transpositions halved, a common prefix
// of up to four characters boosted by 0.1), when that similarity is at least 0.90; equal
// similarities go to the larger amount due, then the earlier due date, then the lower id. The rest
// is applied automatically as usual. Disputed invoices and invoices with nothing due are not
// candidates. The payment row shows the matched invoice number (empty when none) and the similarity
// to three decimals, rounded half up.
test.describe('remittance matching', () => {
  test('pays the invoice whose purchase order the remittance matches best', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-04-20',
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      invoices: [
        { id: 1, clientId: 1, status: 'SENT', issueDate: '2026-03-01', dueDate: '2026-05-31',
          poNumber: 'Marina Refit',
          lineItems: [{ id: 1, description: 'Refit', qty: 1, unitPrice: 400 }] },
        { id: 2, clientId: 1, status: 'SENT', issueDate: '2026-03-01', dueDate: '2026-05-15',
          poNumber: 'Paint Lights',
          lineItems: [{ id: 2, description: 'Lighting', qty: 1, unitPrice: 900 }] },
        { id: 3, clientId: 1, status: 'SENT', issueDate: '2026-03-01', dueDate: '2026-03-31',
          poNumber: 'Hull Paint',
          lineItems: [{ id: 3, description: 'Hull', qty: 1, unitPrice: 60 }] },
        { id: 4, clientId: 1, status: 'DRAFT', issueDate: '2026-04-01', dueDate: '2026-05-31',
          lineItems: [{ id: 4, description: 'Deck', qty: 1, unitPrice: 250 }] },
      ],
    });
    await page.goto('/');

    await page.getByTestId('client-row-1').click();
    // a purchase order number can be added to an invoice
    await page.getByTestId('invoice-row-4').click();
    await page.getByTestId('invoice-po-input').fill('Deck Works');
    await page.getByTestId('invoice-po-submit').click();
    await expect(page.getByTestId('invoice-po')).toHaveText('Deck Works');
    await page.getByTestId('client-row-1').click();
    // "marina lights" is most like "Marina Refit", but 0.888 is under 0.90: nothing matches, and the
    // payment goes in the usual order, the overdue invoice 3, then the smallest amounts due first
    await page.getByTestId('payment-form-amount').fill('500');
    await page.getByTestId('payment-form-date').fill('2026-04-20');
    await page.getByTestId('payment-form-remittance').fill('marina lights');
    await page.getByTestId('payment-form-submit').click();
    await expect.poll(() => auditLines().filter((l) => l.startsWith('PAYMENT_RECORDED'))).toEqual([
      'PAYMENT_RECORDED id=1 invoice=3 amount=60.00',
      'PAYMENT_RECORDED id=1 invoice=1 amount=400.00',
      'PAYMENT_RECORDED id=1 invoice=2 amount=40.00',
    ]);
    await page.getByTestId('invoice-row-1').click();
    await expect(page.getByTestId('payment-row-1').getByTestId('payment-match')).toHaveText('');
    await expect(page.getByTestId('invoice-panel-status')).toHaveText('Paid');
    // nothing close enough: paid in the usual order, matching nothing
    await page.getByTestId('client-row-1').click();
    await page.getByTestId('payment-form-amount').fill('100');
    await page.getByTestId('payment-form-date').fill('2026-04-20');
    await page.getByTestId('payment-form-remittance').fill('thanks');
    await page.getByTestId('payment-form-submit').click();
    await page.getByTestId('invoice-row-2').click();
    await expect(page.getByTestId('payment-row-2').getByTestId('payment-match')).toHaveText('');
    await expect(page.getByTestId('invoice-amount-due')).toHaveText('$760.00'); // 900.00 - 40.00 - 100.00
  });

  test('two equally good matches go to the earlier due date', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-04-20',
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      invoices: [
        { id: 5, clientId: 1, status: 'SENT', issueDate: '2026-03-01', dueDate: '2026-05-31',
          poNumber: 'Hull Paint',
          lineItems: [{ id: 5, description: 'Paint', qty: 1, unitPrice: 300 }] },
        { id: 6, clientId: 1, status: 'SENT', issueDate: '2026-03-05', dueDate: '2026-05-15',
          poNumber: 'Hull Paint',
          lineItems: [{ id: 6, description: 'Paint', qty: 1, unitPrice: 200 }] },
        { id: 7, clientId: 1, status: 'SENT', issueDate: '2026-03-05', dueDate: '2026-05-15',
          poNumber: 'Hull paint 2', disputedOn: '2026-04-10',
          lineItems: [{ id: 7, description: 'Paint', qty: 1, unitPrice: 500 }] },
      ],
    });
    await page.goto('/');

    await page.getByTestId('client-row-1').click();
    // both purchase orders match exactly (case does not count): invoice 5 owes more (300.00 against 200.00), so it is paid first. The disputed
    // invoice 7 is not open to payments, however close its purchase order
    await page.getByTestId('payment-form-amount').fill('200');
    await page.getByTestId('payment-form-date').fill('2026-04-20');
    await page.getByTestId('payment-form-remittance').fill('HULL PAINT');
    await page.getByTestId('payment-form-submit').click();
    await page.getByTestId('invoice-row-5').click();
    await expect(page.getByTestId('payment-row-1').getByTestId('payment-match')).toHaveText('INV-0000059');
    await expect(page.getByTestId('payment-row-1').getByTestId('payment-match-score')).toHaveText('1.000');
    await expect(page.getByTestId('invoice-panel-status')).toHaveText('Part paid');
    await expect(page.getByTestId('invoice-row-6').getByTestId('invoice-status')).toHaveText('Sent');
  });
});
