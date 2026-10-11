import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';
import { auditLines } from '../support/audit';

// The invoice list has no allocation boxes any more: a payment goes to the open invoice, to the
// invoices its references name, or is spread automatically. Payments already split over several
// invoices keep their parts.
test.describe('no allocation boxes', () => {
  test('invoices no longer have allocation boxes', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-03-10',
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      invoices: [
        { id: 5, clientId: 1, status: 'SENT', issueDate: '2026-03-01', dueDate: '2026-04-30',
          lineItems: [{ id: 1, description: 'Design', qty: 1, unitPrice: 120 }] },
        { id: 6, clientId: 1, status: 'SENT', issueDate: '2026-03-01', dueDate: '2026-03-31',
          lineItems: [{ id: 2, description: 'Hosting', qty: 1, unitPrice: 50 }] },
      ],
      payments: [
        { id: 1, clientId: 1, amount: 150, date: '2026-03-05',
          allocations: [{ invoiceId: 5, amount: 100 }, { invoiceId: 6, amount: 30 }] },
      ],
    });
    await page.goto('/');

    await page.getByTestId('client-row-1').click();
    await expect(page.getByTestId('invoice-row-5').getByTestId('invoice-allocate')).toHaveCount(0);
    await expect(page.getByTestId('invoice-row-6').getByTestId('invoice-allocate')).toHaveCount(0);
    // a payment already split over both invoices still shows its part on each
    await page.getByTestId('invoice-row-6').click();
    await expect(page.getByTestId('payment-row-1').getByTestId('payment-allocated')).toHaveText('$30.00');
    await expect(page.getByTestId('invoice-amount-due')).toHaveText('$20.00'); // 50.00 - 30.00
    // with no invoice open, a payment is spread automatically: none overdue, so the largest
    // amount due first (20.00 each), each paid off before the next
    await page.getByTestId('client-row-1').click();
    await page.getByTestId('payment-form-amount').fill('40');
    await page.getByTestId('payment-form-date').fill('2026-03-09');
    await page.getByTestId('payment-form-submit').click();
    await expect.poll(() => auditLines().filter((l) => l.startsWith('PAYMENT_RECORDED'))).toEqual([
      'PAYMENT_RECORDED id=2 invoice=5 amount=20.00',
      'PAYMENT_RECORDED id=2 invoice=6 amount=20.00',
    ]);
    await expect(page.getByTestId('invoice-row-5').getByTestId('invoice-status')).toHaveText('Paid');
    await expect(page.getByTestId('invoice-row-6').getByTestId('invoice-status')).toHaveText('Paid');
  });
});
