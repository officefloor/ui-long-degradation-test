import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';
import { auditLines } from '../support/audit';

// UPDATED for cp92 (mutates: [15, 40, 59]): a small balance is now written off only when it is
// under $2.00 and no more than 1% of the grand total, so exactly 1.00 left of 100.00 would now be
// written off; that test is replaced by one leaving 1.50 (1.5%), which stays due. Carries the 0.60
// test.
// When payments leave less than $2.00 due on an invoice and it is no more than 1% of the grand
// total, the rest is written off: the invoice is Paid, its amount due is $0.00 and the panel shows the amount written off ($0.00 when nothing is).
// Recording the payment that leaves it writes INVOICE_WRITTEN_OFF id=<invoice id> amount=<amount>.
test.describe('write off a small balance', () => {
  test('writes off less than a dollar left due', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-03-10',
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      invoices: [
        { id: 1, clientId: 1, status: 'SENT', issueDate: '2026-03-01', dueDate: '2026-04-30',
          lineItems: [{ id: 1, description: 'Design', qty: 1, unitPrice: 100 }] },
        { id: 2, clientId: 1, status: 'SENT', issueDate: '2026-03-01', dueDate: '2026-04-30',
          lineItems: [{ id: 2, description: 'Hosting', qty: 1, unitPrice: 100 }] },
      ],
    });
    await page.goto('/');

    await page.getByTestId('client-row-1').click();
    await page.getByTestId('invoice-row-1').click();
    await expect(page.getByTestId('invoice-written-off')).toHaveText('$0.00');
    await page.getByTestId('payment-form-amount').fill('99.40');
    await page.getByTestId('payment-form-date').fill('2026-03-09');
    await page.getByTestId('payment-form-submit').click();
    await expect(page.getByTestId('invoice-paid')).toHaveText('$99.40');
    await expect(page.getByTestId('invoice-written-off')).toHaveText('$0.60'); // 100.00 - 99.40
    await expect(page.getByTestId('invoice-amount-due')).toHaveText('$0.00');
    await expect(page.getByTestId('invoice-panel-status')).toHaveText('Paid');
    await expect.poll(() => auditLines()).toContain('INVOICE_WRITTEN_OFF id=1 amount=0.60');
  });

  test('more than 1% of the total stays due', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-03-10',
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      invoices: [
        { id: 1, clientId: 1, status: 'SENT', issueDate: '2026-03-01', dueDate: '2026-04-30',
          lineItems: [{ id: 1, description: 'Design', qty: 1, unitPrice: 100 }] },
        { id: 2, clientId: 1, status: 'SENT', issueDate: '2026-03-01', dueDate: '2026-04-30',
          lineItems: [{ id: 2, description: 'Hosting', qty: 1, unitPrice: 100 }] },
      ],
    });
    await page.goto('/');

    await page.getByTestId('client-row-1').click();
    await page.getByTestId('invoice-row-2').click();
    await page.getByTestId('payment-form-amount').fill('98.50');
    await page.getByTestId('payment-form-date').fill('2026-03-09');
    await page.getByTestId('payment-form-submit').click();
    // 1.50 left is under $2.00 but 1.5% of the 100.00 total
    await expect(page.getByTestId('invoice-amount-due')).toHaveText('$1.50');
    await expect(page.getByTestId('invoice-written-off')).toHaveText('$0.00');
    await expect(page.getByTestId('invoice-panel-status')).toHaveText('Part paid');
    expect(auditLines().filter((l) => l.startsWith('INVOICE_WRITTEN_OFF'))).toEqual([]);
  });
});
