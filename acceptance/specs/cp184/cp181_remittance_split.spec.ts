import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';
import { auditLines } from '../support/audit';

// UPDATED for cp184 (mutates: [159, 181]): matching now needs 0.90 and equally good matches go to
// the larger amount due first; both tests' matches are exact, and invoice 5 is both due first and
// larger, so their results hold. Carries both tests.
// Remittance text may name several purchase orders separated by semicolons. Each part is matched in
// turn as a remittance is, to an open invoice not already matched by an earlier part; the payment
// pays the matched invoices in that order, then the rest automatically. The payment row shows the
// matched invoice numbers and their similarities, comma separated, in that order.
test.describe('several purchase orders in one remittance', () => {
  test('pays each purchase order a remittance names, in order', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-04-20',
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      invoices: [
        { id: 1, clientId: 1, status: 'SENT', issueDate: '2026-03-01', dueDate: '2026-05-31',
          poNumber: 'Marina Refit',
          lineItems: [{ id: 1, description: 'Refit', qty: 1, unitPrice: 400 }] },
        { id: 2, clientId: 1, status: 'SENT', issueDate: '2026-03-01', dueDate: '2026-05-15',
          poNumber: 'Hull Paint',
          lineItems: [{ id: 2, description: 'Paint', qty: 1, unitPrice: 300 }] },
        { id: 3, clientId: 1, status: 'SENT', issueDate: '2026-03-01', dueDate: '2026-05-20',
          poNumber: 'Deck Works',
          lineItems: [{ id: 3, description: 'Deck', qty: 1, unitPrice: 900 }] },
      ],
    });
    await page.goto('/');

    await page.getByTestId('client-row-1').click();
    // two purchase orders: the hull paint first (300.00), then the marina refit (400.00); the last 100.00
    // goes on automatically, to the deck works
    await page.getByTestId('payment-form-amount').fill('800');
    await page.getByTestId('payment-form-date').fill('2026-04-20');
    await page.getByTestId('payment-form-remittance').fill('hull paint; marina refit');
    await page.getByTestId('payment-form-submit').click();
    await expect.poll(() => auditLines().filter((l) => l.startsWith('PAYMENT_RECORDED'))).toEqual([
      'PAYMENT_RECORDED id=1 invoice=2 amount=300.00',
      'PAYMENT_RECORDED id=1 invoice=1 amount=400.00',
      'PAYMENT_RECORDED id=1 invoice=3 amount=100.00',
    ]);
    await page.getByTestId('invoice-row-2').click();
    await expect(page.getByTestId('payment-row-1').getByTestId('payment-match')).toHaveText('INV-0000026, INV-0000018');
    await expect(page.getByTestId('payment-row-1').getByTestId('payment-match-score')).toHaveText('1.000, 1.000');
  });

  test('the same purchase order twice matches two invoices', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-04-20',
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      invoices: [
        { id: 4, clientId: 1, status: 'SENT', issueDate: '2026-03-01', dueDate: '2026-05-31',
          poNumber: 'Hull Paint',
          lineItems: [{ id: 4, description: 'Paint', qty: 1, unitPrice: 200 }] },
        { id: 5, clientId: 1, status: 'SENT', issueDate: '2026-03-01', dueDate: '2026-05-15',
          poNumber: 'Hull Paint',
          lineItems: [{ id: 5, description: 'Paint', qty: 1, unitPrice: 250 }] },
      ],
    });
    await page.goto('/');

    await page.getByTestId('client-row-1').click();
    // an invoice is matched only once: the larger amount due first: invoice 5 (250.00), then invoice 4
    await page.getByTestId('payment-form-amount').fill('450');
    await page.getByTestId('payment-form-date').fill('2026-04-20');
    await page.getByTestId('payment-form-remittance').fill('hull paint; hull paint');
    await page.getByTestId('payment-form-submit').click();
    await page.getByTestId('invoice-row-4').click();
    await expect(page.getByTestId('payment-row-1').getByTestId('payment-match')).toHaveText('INV-0000059, INV-0000042');
    await expect(page.getByTestId('invoice-panel-status')).toHaveText('Paid');
    await expect(page.getByTestId('invoice-row-5').getByTestId('invoice-status')).toHaveText('Paid');
  });
});
