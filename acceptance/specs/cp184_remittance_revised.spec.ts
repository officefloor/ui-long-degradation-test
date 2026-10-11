import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';
import { auditLines } from '../support/audit';

// A remittance now matches a purchase order only at a Jaro-Winkler similarity of 0.90 or more, and
// of equally similar open invoices the one with the larger amount due is paid first (then the
// earlier due date, then the lower id).
test.describe('stricter remittance matching', () => {
  test('matches only very similar purchase orders, the larger amount first', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-04-20',
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      invoices: [
        { id: 1, clientId: 1, status: 'SENT', issueDate: '2026-03-01', dueDate: '2026-05-31',
          poNumber: 'Marina Refit',
          lineItems: [{ id: 1, description: 'Refit', qty: 1, unitPrice: 400 }] },
        { id: 2, clientId: 1, status: 'SENT', issueDate: '2026-03-01', dueDate: '2026-04-01',
          poNumber: 'Paint Lights',
          lineItems: [{ id: 2, description: 'Lighting', qty: 1, unitPrice: 900 }] },
        { id: 3, clientId: 1, status: 'SENT', issueDate: '2026-03-01', dueDate: '2026-05-10',
          poNumber: 'Hull Paint',
          lineItems: [{ id: 3, description: 'Paint', qty: 1, unitPrice: 150 }] },
        { id: 4, clientId: 1, status: 'SENT', issueDate: '2026-03-01', dueDate: '2026-05-20',
          poNumber: 'Hull Paint',
          lineItems: [{ id: 4, description: 'Paint', qty: 1, unitPrice: 450 }] },
      ],
    });
    await page.goto('/');

    await page.getByTestId('client-row-1').click();
    // "marina lights" is 0.888 like "Marina Refit": under 0.90 now, so nothing matches and the payment
    // goes in the usual order, to the overdue invoice 2 first
    await page.getByTestId('payment-form-amount').fill('400');
    await page.getByTestId('payment-form-date').fill('2026-04-20');
    await page.getByTestId('payment-form-remittance').fill('marina lights');
    await page.getByTestId('payment-form-submit').click();
    await expect.poll(() => auditLines()).toContain('PAYMENT_RECORDED id=1 invoice=2 amount=400.00');
    await page.getByTestId('invoice-row-2').click();
    await expect(page.getByTestId('payment-row-1').getByTestId('payment-match')).toHaveText('');
    // two exact matches: the larger amount due (invoice 4, 450.00) before the earlier due date (invoice 3)
    await page.getByTestId('client-row-1').click();
    await page.getByTestId('payment-form-amount').fill('450');
    await page.getByTestId('payment-form-date').fill('2026-04-20');
    await page.getByTestId('payment-form-remittance').fill('Hull Paint');
    await page.getByTestId('payment-form-submit').click();
    await page.getByTestId('invoice-row-4').click();
    await expect(page.getByTestId('invoice-panel-number')).toHaveText(await page.getByTestId('invoice-row-4').getByTestId('invoice-number').innerText());
    await expect(page.getByTestId('payment-row-2').getByTestId('payment-match')).toHaveText('INV-0000042');
    await expect(page.getByTestId('invoice-panel-status')).toHaveText('Paid');
    await expect(page.getByTestId('invoice-row-3').getByTestId('invoice-status')).toHaveText('Sent');
  });
});
