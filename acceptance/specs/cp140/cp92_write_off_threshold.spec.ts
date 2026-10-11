import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';
import { auditLines } from '../support/audit';

// UPDATED for cp140 (mutates: [40, 43, 61, 92]): a small balance is now written off only when it is
// worth less than $0.05 (and at most 1% of the total); the test writing off 1.50 and 0.50 is
// replaced by one writing off 0.03 and keeping 0.50 due. Carries the 0.70 test.
// After a payment, what is left on an invoice is written off only when it is worth less than $0.05
// at the workspace rates and is no more than 1% of the invoice's grand total; otherwise it stays
// due.
test.describe('small balance write-off', () => {
  test('keeps a small balance that is more than 1% of the total', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-03-10',
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      invoices: [
        { id: 4, clientId: 1, status: 'SENT', issueDate: '2026-03-01', dueDate: '2026-04-30',
          lineItems: [{ id: 1, description: 'Design', qty: 1, unitPrice: 60 }] },
      ],
    });
    await page.goto('/');

    await page.getByTestId('client-row-1').click();
    await page.getByTestId('invoice-row-4').click();
    await page.getByTestId('payment-form-amount').fill('59.30');
    await page.getByTestId('payment-form-date').fill('2026-03-09');
    await page.getByTestId('payment-form-submit').click();
    // 0.70 left is not under $0.05 (and more than 1% of 60.00): it stays due
    await expect(page.getByTestId('invoice-amount-due')).toHaveText('$0.70');
    await expect(page.getByTestId('invoice-written-off')).toHaveText('$0.00');
    await expect(page.getByTestId('invoice-panel-status')).toHaveText('Part paid');
  });

  test('writes off less than five cents that is no more than 1% of the total', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-03-10',
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      invoices: [
        { id: 1, clientId: 1, status: 'SENT', issueDate: '2026-03-01', dueDate: '2026-04-30',
          lineItems: [{ id: 1, description: 'Build', qty: 1, unitPrice: 500 }] },
        { id: 2, clientId: 1, status: 'SENT', issueDate: '2026-03-01', dueDate: '2026-04-30',
          lineItems: [{ id: 2, description: 'Design', qty: 1, unitPrice: 50 }] },
      ],
    });
    await page.goto('/');

    await page.getByTestId('client-row-1').click();
    const pays = [['1', '499.97'], ['2', '49.50']];
    for (const [id, amount] of pays) {
      await page.getByTestId(`invoice-row-${id}`).click();
      await page.getByTestId('payment-form-amount').fill(amount);
      await page.getByTestId('payment-form-date').fill('2026-03-09');
      await page.getByTestId('payment-form-submit').click();
    }
    // 0.03 left of 500.00: written off
    await page.getByTestId('invoice-row-1').click();
    await expect(page.getByTestId('invoice-written-off')).toHaveText('$0.03');
    await expect(page.getByTestId('invoice-panel-status')).toHaveText('Paid');
    // 0.50 left of 50.00 is 1%, but not under $0.05: it stays due
    await page.getByTestId('invoice-row-2').click();
    await expect(page.getByTestId('invoice-amount-due')).toHaveText('$0.50');
    await expect(page.getByTestId('invoice-panel-status')).toHaveText('Part paid');
    await expect.poll(() => auditLines().filter((l) => l.startsWith('INVOICE_WRITTEN_OFF'))).toEqual([
      'INVOICE_WRITTEN_OFF id=1 amount=0.03',
    ]);
  });
});
