import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';
import { auditLines } from '../support/audit';

// When payments leave less than $1.00 due on an invoice, the rest is written off: the invoice is
// Paid, its amount due is $0.00 and the panel shows the amount written off ($0.00 when nothing is).
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

  test('a dollar or more stays due', { tag: '@core' }, async ({ page }) => {
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
    await page.getByTestId('payment-form-amount').fill('99');
    await page.getByTestId('payment-form-date').fill('2026-03-09');
    await page.getByTestId('payment-form-submit').click();
    await expect(page.getByTestId('invoice-amount-due')).toHaveText('$1.00'); // 100.00 - 99.00
    await expect(page.getByTestId('invoice-written-off')).toHaveText('$0.00');
    await expect(page.getByTestId('invoice-panel-status')).toHaveText('Part paid');
    expect(auditLines().filter((l) => l.startsWith('INVOICE_WRITTEN_OFF'))).toEqual([]);
  });
});
