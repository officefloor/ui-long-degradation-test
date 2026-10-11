import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';
import { auditLines } from '../support/audit';

// UPDATED for cp64 (mutates: [22, 24, 50]): named invoices are now paid overdue first, then largest
// amount due first, so the 120.00 pays invoice 1 (100.00) and 20.00 of invoice 7, leaving invoice
// 123 untouched. Carries both tests.
// With no invoice open, the reference box takes several references separated by commas (RF
// references or invoice numbers, mixed). The payment is applied to just those invoices: overdue ones
// first (oldest due date first), then the largest amount due first (lower id on the same amount),
// each paid off before the next. It is refused if any
// reference is mistyped or not one of the selected client's invoices; anything paid beyond what
// those invoices owe together is held as credit.
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

    // none of the three is overdue: 1 (100.00, the largest) takes 100.00, then 7 (60.00) the last
    // 20.00; 123 (30.00) gets nothing
    await expect.poll(() => auditLines().filter((l) => l.startsWith('PAYMENT_RECORDED'))).toEqual([
      'PAYMENT_RECORDED id=1 invoice=1 amount=100.00',
      'PAYMENT_RECORDED id=1 invoice=7 amount=20.00',
    ]);
    await expect(page.getByTestId('invoice-row-7').getByTestId('invoice-status')).toHaveText('Part paid');
    await expect(page.getByTestId('invoice-row-123').getByTestId('invoice-status')).toHaveText('Sent');
    await expect(page.getByTestId('invoice-row-1').getByTestId('invoice-status')).toHaveText('Paid');
    await expect(page.getByTestId('invoice-row-12').getByTestId('invoice-status')).toHaveText('Overdue');
    await page.getByTestId('invoice-row-7').click();
    await expect(page.getByTestId('invoice-amount-due')).toHaveText('$40.00'); // 60.00 - 20.00
  });

  test('refuses a wrong reference and keeps an overpayment as credit', { tag: '@core' }, async ({ page }) => {
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
    ];
    for (const [amount, references] of attempts) {
      await page.getByTestId('payment-form-amount').fill(amount);
      await page.getByTestId('payment-form-date').fill('2026-04-20');
      await page.getByTestId('payment-form-reference').fill(references);
      await page.getByTestId('payment-form-submit').click();
      await expect(page.getByTestId('payment-form-error')).toBeVisible();
    }
    expect(auditLines().filter((l) => l.startsWith('PAYMENT_RECORDED'))).toEqual([]);

    // they owe 100 + 60 + 30 = 190.00 on the three named invoices; the other 10.00 is held
    await page.getByTestId('payment-form-amount').fill('200');
    await page.getByTestId('payment-form-date').fill('2026-04-20');
    await page.getByTestId('payment-form-reference').fill('INV-0000018, RF16 0000 075, INV-0001230');
    await page.getByTestId('payment-form-submit').click();
    for (const id of [1, 7, 123]) {
      await expect(page.getByTestId(`invoice-row-${id}`).getByTestId('invoice-status')).toHaveText('Paid');
    }
    await expect(page.getByTestId('invoice-row-12').getByTestId('invoice-status')).toHaveText('Overdue');
    await expect.poll(() => auditLines()).toContain('CREDIT_HELD payment=1 amount=10.00');
    await expect(page.getByTestId('client-row-1').getByTestId('client-credit')).toHaveText('$10.00');
  });
});
