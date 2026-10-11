import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';
import { auditLines } from '../support/audit';

// Invoices, credit notes and adjustment notes issued on or after 2026-07-01 (and drafts from then
// on) are numbered with an ISO 7064 MOD 11-2 check character instead of the Luhn digit: over the
// six digits of the id, p starts at 0 and for each digit becomes (p + digit) x 2 mod 11; the check
// is (12 - p) mod 11, written X when it is 10. Their RF payment reference is built from the six
// digits and that check character, and references and remittance matching use the new numbers.
// Anything issued before then keeps its number.
test.describe('a MOD 11-2 check character', () => {
  test('invoices issued from July take a MOD 11-2 check character, in their references too', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-07-15',
      settings: { taxRate: 10 },
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      invoices: [
        { id: 1, clientId: 1, status: 'SENT', issueDate: '2026-06-20', dueDate: '2026-07-31',
          lineItems: [{ id: 1, description: 'Design', qty: 1, unitPrice: 100 }] },
        { id: 5, clientId: 1, status: 'DRAFT', issueDate: '2026-07-14', dueDate: '2026-08-31',
          lineItems: [{ id: 4, description: 'Support', qty: 1, unitPrice: 60 }] },
        { id: 28, clientId: 1, status: 'SENT', issueDate: '2026-07-02', dueDate: '2026-08-31',
          lineItems: [{ id: 2, description: 'Build', qty: 1, unitPrice: 500 }] },
        { id: 36, clientId: 1, status: 'SENT', issueDate: '2026-07-01', dueDate: '2026-08-31',
          poNumber: 'PO-5521',
          lineItems: [{ id: 3, description: 'Hosting', qty: 1, unitPrice: 80 }] },
      ],
    });
    await page.goto('/');

    await page.getByTestId('client-row-1').click();
    // invoice 28, issued on 2026-07-02, is INV-000028X: the Luhn form of its number is no invoice of the client
    await page.getByTestId('payment-form-amount').fill('550');
    await page.getByTestId('payment-form-date').fill('2026-07-15');
    await page.getByTestId('payment-form-reference').fill('INV-0000281');
    await page.getByTestId('payment-form-submit').click();
    await expect(page.getByTestId('payment-form-error')).toBeVisible();
    // its reference is built from the six digits and the X
    await page.getByTestId('payment-form-reference').fill('RF46 0000 28X');
    await page.getByTestId('payment-form-submit').click();
    await expect.poll(() => auditLines()).toContain('PAYMENT_RECORDED id=1 invoice=28 amount=550.00');
    // remittance matching names the new numbers
    await page.getByTestId('payment-form-amount').fill('88');
    await page.getByTestId('payment-form-date').fill('2026-07-15');
    await page.getByTestId('payment-form-reference').fill('');
    await page.getByTestId('payment-form-remittance').fill('PO 5521');
    await page.getByTestId('payment-form-submit').click();
    await expect.poll(() => auditLines()).toContain('PAYMENT_RECORDED id=2 invoice=36 amount=88.00');
    await page.getByTestId('invoice-row-36').click();
    await expect(page.getByTestId('payment-row-2').getByTestId('payment-match')).toHaveText('INV-000036X');
    await expect(page.getByTestId('invoice-panel-status')).toHaveText('Paid');
    // 000028: p stays 0 over the four zeros, then (0 + 2) x 2 = 4 and (4 + 8) x 2 = 24, mod 11 = 2;
    // (12 - 2) mod 11 = 10 is written X
    await page.getByTestId('invoice-row-28').click();
    await expect(page.getByTestId('invoice-panel-number')).toHaveText(await page.getByTestId('invoice-row-28').getByTestId('invoice-number').innerText());
    await expect(page.getByTestId('invoice-panel-number')).toHaveText('INV-000028X');
    await expect(page.getByTestId('invoice-reference')).toHaveText('RF46 0000 28X');
    await expect(page.getByTestId('invoice-panel-status')).toHaveText('Paid');
    // issued in June: invoice 1 keeps its Luhn digit
    await page.getByTestId('invoice-row-1').click();
    await expect(page.getByTestId('invoice-panel-number')).toHaveText(await page.getByTestId('invoice-row-1').getByTestId('invoice-number').innerText());
    await expect(page.getByTestId('invoice-panel-number')).toHaveText('INV-0000018');
    await expect(page.getByTestId('invoice-reference')).toHaveText('RF03 0000 018');
    // a draft shown today takes the new check character, and keeps it when sent
    await page.getByTestId('invoice-row-5').click();
    await expect(page.getByTestId('invoice-panel-number')).toHaveText(await page.getByTestId('invoice-row-5').getByTestId('invoice-number').innerText());
    await expect(page.getByTestId('invoice-panel-number')).toHaveText('INV-0000052');
    await page.getByTestId('invoice-send').click();
    await expect.poll(() => auditLines()).toContain('INVOICE_SENT id=5 number=INV-0000052 total=66.00');
  });
});
