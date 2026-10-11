import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';
import { auditLines } from '../support/audit';

// UPDATED for cp76 (mutates: [21, 43]): the allocation boxes are gone, so the two tests that split
// a payment through them are retired. Carries the test of a payment already split over two
// invoices.
// A payment already spread over several of the client's invoices (payments[].allocations) shows, in
// each invoice's panel, the whole payment and how much of it went to that invoice.
test.describe('split a payment', () => {

  test('shows each invoice its part of a split payment', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-03-10',
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      invoices: [
        { id: 5, clientId: 1, status: 'SENT', issueDate: '2026-03-01', dueDate: '2026-04-30',
          lineItems: [{ id: 1, description: 'Design', qty: 1, unitPrice: 120 }] },
        { id: 6, clientId: 1, status: 'SENT', issueDate: '2026-03-01', dueDate: '2026-04-30',
          lineItems: [{ id: 2, description: 'Hosting', qty: 1, unitPrice: 50 }] },
      ],
      payments: [
        { id: 1, clientId: 1, amount: 150, date: '2026-03-05',
          allocations: [{ invoiceId: 5, amount: 100 }, { invoiceId: 6, amount: 50 }] },
      ],
    });
    await page.goto('/');

    await page.getByTestId('client-row-1').click();
    await page.getByTestId('invoice-row-5').click();
    await expect(page.getByTestId('payment-row-1').getByTestId('payment-amount')).toHaveText('$150.00');
    await expect(page.getByTestId('payment-row-1').getByTestId('payment-allocated')).toHaveText('$100.00');
    await expect(page.getByTestId('invoice-paid')).toHaveText('$100.00');
    await expect(page.getByTestId('invoice-amount-due')).toHaveText('$20.00'); // 120.00 - 100.00
    await expect(page.getByTestId('invoice-panel-status')).toHaveText('Part paid');
    await page.getByTestId('invoice-row-6').click();
    await expect(page.getByTestId('payment-row-1').getByTestId('payment-allocated')).toHaveText('$50.00');
    await expect(page.getByTestId('invoice-paid')).toHaveText('$50.00');
    await expect(page.getByTestId('invoice-amount-due')).toHaveText('$0.00');
    await expect(page.getByTestId('invoice-panel-status')).toHaveText('Paid');
  });
});
