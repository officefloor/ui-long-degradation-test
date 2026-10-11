import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';
import { auditLines } from '../support/audit';

// With no invoice open, the reference box takes several references separated by commas (RF
// references or invoice numbers, mixed). The payment is applied to just those invoices, earliest due
// date first (lower id on the same date), each paid off before the next. It is refused if any
// reference is mistyped or not one of the selected client's invoices, or if the payment is more than
// those invoices owe together.
test.describe('several references', () => {
  test('applies one payment to the invoices its references name', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-04-20',
      clients: [
        { id: 1, name: 'Acme Ltd', email: 'ops@acme.example' },
        { id: 2, name: 'Globex Corp', email: 'billing@globex.example' },
      ],
      invoices: [
        { id: 1, clientId: 1, status: 'SENT', issueDate: '2026-03-01', dueDate: '2026-05-31',
          lineItems: [{ id: 1, description: 'Design', qty: 1, unitPrice: 100 }] },
        { id: 7, clientId: 1, status: 'SENT', issueDate: '2026-02-01', dueDate: '2026-04-30',
          lineItems: [{ id: 2, description: 'Hosting', qty: 1, unitPrice: 60 }] },
        { id: 12, clientId: 1, status: 'SENT', issueDate: '2026-01-15', dueDate: '2026-03-31',
          lineItems: [{ id: 3, description: 'Support', qty: 1, unitPrice: 40 }] },
        { id: 123, clientId: 1, status: 'SENT', issueDate: '2026-02-01', dueDate: '2026-04-30',
          lineItems: [{ id: 4, description: 'Training', qty: 1, unitPrice: 30 }] },
        { id: 58, clientId: 2, status: 'SENT', issueDate: '2026-02-01', dueDate: '2026-04-30',
          lineItems: [{ id: 5, description: 'Audit', qty: 1, unitPrice: 10 }] },
      ],
    });
    await page.goto('/');

    await page.getByTestId('client-row-1').click();
    await page.getByTestId('payment-form-amount').fill('120');
    await page.getByTestId('payment-form-date').fill('2026-04-20');
    // invoices 1, 7 and 123 (rf_reference / invoice_number_luhn); overdue invoice 12 is not named
    await page.getByTestId('payment-form-reference').fill('INV-0000018, RF16 0000 075, inv-0001230');
    await page.getByTestId('payment-form-submit').click();

    // 7 (due 04-30) takes 60.00, 123 (04-30, higher id) 30.00, 1 (05-31) the last 30.00
    await expect.poll(() => auditLines().filter((l) => l.startsWith('PAYMENT_RECORDED'))).toEqual([
      'PAYMENT_RECORDED id=1 invoice=7 amount=60.00',
      'PAYMENT_RECORDED id=1 invoice=123 amount=30.00',
      'PAYMENT_RECORDED id=1 invoice=1 amount=30.00',
    ]);
    await expect(page.getByTestId('invoice-row-7').getByTestId('invoice-status')).toHaveText('Paid');
    await expect(page.getByTestId('invoice-row-123').getByTestId('invoice-status')).toHaveText('Paid');
    await expect(page.getByTestId('invoice-row-1').getByTestId('invoice-status')).toHaveText('Part paid');
    await expect(page.getByTestId('invoice-row-12').getByTestId('invoice-status')).toHaveText('Overdue');
    await page.getByTestId('invoice-row-1').click();
    await expect(page.getByTestId('invoice-amount-due')).toHaveText('$70.00'); // 100.00 - 30.00
  });

  test('refuses the payment if any reference is wrong or it is too much', { tag: '@error' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-04-20',
      clients: [
        { id: 1, name: 'Acme Ltd', email: 'ops@acme.example' },
        { id: 2, name: 'Globex Corp', email: 'billing@globex.example' },
      ],
      invoices: [
        { id: 1, clientId: 1, status: 'SENT', issueDate: '2026-03-01', dueDate: '2026-05-31',
          lineItems: [{ id: 1, description: 'Design', qty: 1, unitPrice: 100 }] },
        { id: 7, clientId: 1, status: 'SENT', issueDate: '2026-02-01', dueDate: '2026-04-30',
          lineItems: [{ id: 2, description: 'Hosting', qty: 1, unitPrice: 60 }] },
        { id: 12, clientId: 1, status: 'SENT', issueDate: '2026-01-15', dueDate: '2026-03-31',
          lineItems: [{ id: 3, description: 'Support', qty: 1, unitPrice: 40 }] },
        { id: 123, clientId: 1, status: 'SENT', issueDate: '2026-02-01', dueDate: '2026-04-30',
          lineItems: [{ id: 4, description: 'Training', qty: 1, unitPrice: 30 }] },
        { id: 58, clientId: 2, status: 'SENT', issueDate: '2026-02-01', dueDate: '2026-04-30',
          lineItems: [{ id: 5, description: 'Audit', qty: 1, unitPrice: 10 }] },
      ],
    });
    await page.goto('/');

    await page.getByTestId('client-row-1').click();
    const attempts = [
      ['100', 'INV-0000018, INV-0000019'],            // 1's check digit is 8
      ['100', 'INV-0000018, INV-0000588'],            // invoice 58 is Globex's
      ['190.01', 'INV-0000018, RF16 0000 075, INV-0001230'], // they owe 100 + 60 + 30 = 190.00
    ];
    for (const [amount, references] of attempts) {
      await page.getByTestId('payment-form-amount').fill(amount);
      await page.getByTestId('payment-form-date').fill('2026-04-20');
      await page.getByTestId('payment-form-reference').fill(references);
      await page.getByTestId('payment-form-submit').click();
      await expect(page.getByTestId('payment-form-error')).toBeVisible();
    }
    for (const id of [1, 7, 123]) {
      await expect(page.getByTestId(`invoice-row-${id}`).getByTestId('invoice-status')).toHaveText('Sent');
    }
    expect(auditLines().filter((l) => l.startsWith('PAYMENT_RECORDED'))).toEqual([]);
  });
});
