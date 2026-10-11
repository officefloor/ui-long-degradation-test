import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';
import { auditLines } from '../support/audit';

// When a payment is applied automatically or by Apply credit, an invoice with only some lines in
// dispute has its undisputed part paid in the usual order; its disputed part waits with the
// disputed invoices and is paid only after every undisputed amount. Each part paid writes its own
// PAYMENT_RECORDED.
test.describe('the disputed part paid last', () => {
  test('pays the undisputed part of an invoice in turn and its disputed part last', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-04-30',
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      invoices: [
        { id: 1, clientId: 1, status: 'SENT', issueDate: '2026-02-01', dueDate: '2026-03-31',
          disputedOn: '2026-04-10',
          lineItems: [
            { id: 1, description: 'Build', qty: 1, unitPrice: 600 },
            { id: 2, description: 'Travel', qty: 1, unitPrice: 200, disputed: true },
          ] },
        { id: 2, clientId: 1, status: 'SENT', issueDate: '2026-04-01', dueDate: '2026-05-31',
          lineItems: [{ id: 3, description: 'Design', qty: 1, unitPrice: 150 }] },
      ],
    });
    await page.goto('/');

    await page.getByTestId('client-row-1').click();
    await page.getByTestId('payment-form-amount').fill('900');
    await page.getByTestId('payment-form-date').fill('2026-04-30');
    await page.getByTestId('payment-form-submit').click();
    // the overdue invoice 1's undisputed 600.00 first, then invoice 2 (150.00); only then 150.00 of the
    // travel line in dispute
    await expect.poll(() => auditLines().filter((l) => l.startsWith('PAYMENT_RECORDED'))).toEqual([
      'PAYMENT_RECORDED id=1 invoice=1 amount=600.00',
      'PAYMENT_RECORDED id=1 invoice=2 amount=150.00',
      'PAYMENT_RECORDED id=1 invoice=1 amount=150.00',
    ]);
    await expect(page.getByTestId('invoice-row-2').getByTestId('invoice-status')).toHaveText('Paid');
    await page.getByTestId('invoice-row-1').click();
    await expect(page.getByTestId('invoice-disputed')).toHaveText('$50.00');
    await expect(page.getByTestId('invoice-panel-status')).toHaveText('Disputed');
  });
});
