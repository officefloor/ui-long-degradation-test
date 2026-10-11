import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';
import { auditLines } from '../support/audit';

// A sent invoice takes payments from the payment form (amount and date) while it is open. The panel
// lists the payments made to it (amount and date) and shows what has been paid and the amount still
// due (grand total - paid). Status follows the payments: Part paid while some is still due, Paid
// once nothing is due. A new payment takes the next id after the highest payment id and writes the
// audit line PAYMENT_RECORDED id=<payment id> invoice=<invoice id> amount=<amount>.
test.describe('record payments', () => {
  test('shows the payments made and what is still due', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-03-10',
      settings: { taxRate: 10 },
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      invoices: [
        { id: 1, clientId: 1, status: 'SENT', issueDate: '2026-02-01', dueDate: '2026-03-31',
          lineItems: [{ id: 1, description: 'Retainer', qty: 1, unitPrice: 200 }] },
        { id: 2, clientId: 1, status: 'SENT', issueDate: '2026-02-01', dueDate: '2026-03-31',
          lineItems: [{ id: 2, description: 'Hosting', qty: 1, unitPrice: 50 }] },
      ],
      payments: [
        { id: 1, clientId: 1, amount: 70, date: '2026-03-05', allocations: [{ invoiceId: 1, amount: 70 }] },
        { id: 2, clientId: 1, amount: 54.40, date: '2026-03-06', allocations: [{ invoiceId: 2, amount: 54.40 }] },
      ],
    });
    await page.goto('/');

    await page.getByTestId('client-row-1').click();
    await expect(page.getByTestId('invoice-row-1').getByTestId('invoice-status')).toHaveText('Part paid');
    await page.getByTestId('invoice-row-1').click();
    await expect(page.getByTestId('invoice-grand-total')).toHaveText('$220.00'); // 200.00 + 10% tax 20.00
    await expect(page.getByTestId('payment-row-1').getByTestId('payment-amount')).toHaveText('$70.00');
    await expect(page.getByTestId('payment-row-1').getByTestId('payment-date')).toHaveText('2026-03-05');
    await expect(page.getByTestId('payment-row-2')).toHaveCount(0);
    await expect(page.getByTestId('invoice-paid')).toHaveText('$70.00');
    await expect(page.getByTestId('invoice-amount-due')).toHaveText('$150.00'); // 220.00 - 70.00
    await expect(page.getByTestId('invoice-panel-status')).toHaveText('Part paid');

    await page.getByTestId('invoice-row-2').click();
    await expect(page.getByTestId('invoice-grand-total')).toHaveText('$55.00'); // 50.00 + 5.00 tax
    await expect(page.getByTestId('invoice-paid')).toHaveText('$54.40');
    await expect(page.getByTestId('invoice-amount-due')).toHaveText('$0.60'); // 55.00 - 54.40
    await expect(page.getByTestId('invoice-panel-status')).toHaveText('Part paid');
  });

  test('recording payments moves the invoice to Part paid then Paid', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-03-10',
      clients: [
        { id: 1, name: 'Acme Ltd', email: 'ops@acme.example' },
        { id: 2, name: 'Globex Corp', email: 'billing@globex.example' },
      ],
      invoices: [
        { id: 2, clientId: 1, status: 'SENT', issueDate: '2026-02-01', dueDate: '2026-03-31',
          lineItems: [{ id: 1, description: 'Audit', qty: 1, unitPrice: 99.50 }] },
        { id: 3, clientId: 2, status: 'SENT', issueDate: '2026-02-01', dueDate: '2026-03-31',
          lineItems: [{ id: 2, description: 'Audit', qty: 1, unitPrice: 10 }] },
      ],
      payments: [{ id: 4, clientId: 2, amount: 10, date: '2026-03-01', allocations: [{ invoiceId: 3, amount: 10 }] }],
    });
    await page.goto('/');

    await page.getByTestId('client-row-1').click();
    await page.getByTestId('invoice-row-2').click();
    await expect(page.getByTestId('invoice-panel-status')).toHaveText('Sent');
    await page.getByTestId('payment-form-amount').fill('49.50');
    await page.getByTestId('payment-form-date').fill('2026-03-06');
    await page.getByTestId('payment-form-submit').click();

    // The highest payment id is 4 (another client's), so this one is 5.
    await expect(page.getByTestId('payment-row-5').getByTestId('payment-amount')).toHaveText('$49.50');
    await expect(page.getByTestId('payment-row-5').getByTestId('payment-date')).toHaveText('2026-03-06');
    await expect(page.getByTestId('invoice-paid')).toHaveText('$49.50');
    await expect(page.getByTestId('invoice-amount-due')).toHaveText('$50.00'); // 99.50 - 49.50
    await expect(page.getByTestId('invoice-panel-status')).toHaveText('Part paid');
    await expect(page.getByTestId('invoice-row-2').getByTestId('invoice-status')).toHaveText('Part paid');
    await expect.poll(() => auditLines()).toContain('PAYMENT_RECORDED id=5 invoice=2 amount=49.50');

    await page.getByTestId('payment-form-amount').fill('50');
    await page.getByTestId('payment-form-date').fill('2026-03-08');
    await page.getByTestId('payment-form-submit').click();
    await expect(page.getByTestId(/^payment-row-\d+$/)).toHaveCount(2);
    await expect(page.getByTestId('invoice-paid')).toHaveText('$99.50'); // 49.50 + 50.00
    await expect(page.getByTestId('invoice-amount-due')).toHaveText('$0.00');
    await expect(page.getByTestId('invoice-panel-status')).toHaveText('Paid');
    await expect(page.getByTestId('invoice-row-2').getByTestId('invoice-status')).toHaveText('Paid');
    await expect.poll(() => auditLines()).toContain('PAYMENT_RECORDED id=6 invoice=2 amount=50.00');
  });
});
