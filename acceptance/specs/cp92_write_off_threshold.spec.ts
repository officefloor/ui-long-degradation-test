import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';
import { auditLines } from '../support/audit';

// After a payment, what is left on an invoice is written off only when it is worth less than $2.00
// at the workspace rates and is no more than 1% of the invoice's grand total; otherwise it stays
// due.
test.describe('small balance write-off', () => {
  test('writes off less than $2.00 that is no more than 1% of the total', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-03-10',
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      invoices: [
        { id: 1, clientId: 1, status: 'SENT', issueDate: '2026-03-01', dueDate: '2026-04-30',
          lineItems: [{ id: 1, description: 'Build', qty: 1, unitPrice: 500 }] },
        { id: 2, clientId: 1, status: 'SENT', issueDate: '2026-03-01', dueDate: '2026-04-30',
          lineItems: [{ id: 2, description: 'Design', qty: 1, unitPrice: 50 }] },
        { id: 3, clientId: 1, status: 'SENT', issueDate: '2026-03-01', dueDate: '2026-04-30',
          lineItems: [{ id: 3, description: 'Build', qty: 1, unitPrice: 300 }] },
      ],
    });
    await page.goto('/');

    await page.getByTestId('client-row-1').click();
    const pays = [['1', '498.50'], ['2', '49.50'], ['3', '297.50']];
    for (const [id, amount] of pays) {
      await page.getByTestId(`invoice-row-${id}`).click();
      await page.getByTestId('payment-form-amount').fill(amount);
      await page.getByTestId('payment-form-date').fill('2026-03-09');
      await page.getByTestId('payment-form-submit').click();
    }
    // 1.50 left of 500.00: under $2.00 and 0.3% of the total, written off
    await page.getByTestId('invoice-row-1').click();
    await expect(page.getByTestId('invoice-written-off')).toHaveText('$1.50');
    await expect(page.getByTestId('invoice-panel-status')).toHaveText('Paid');
    // 0.50 left of 50.00 is 1%: written off
    await page.getByTestId('invoice-row-2').click();
    await expect(page.getByTestId('invoice-panel-number')).toHaveText(await page.getByTestId('invoice-row-2').getByTestId('invoice-number').innerText());
    await expect(page.getByTestId('invoice-written-off')).toHaveText('$0.50');
    // 2.50 left of 300.00 is $2.00 or more: it stays due
    await page.getByTestId('invoice-row-3').click();
    await expect(page.getByTestId('invoice-panel-number')).toHaveText(await page.getByTestId('invoice-row-3').getByTestId('invoice-number').innerText());
    await expect(page.getByTestId('invoice-amount-due')).toHaveText('$2.50');
    await expect(page.getByTestId('invoice-panel-status')).toHaveText('Part paid');
    await expect.poll(() => auditLines().filter((l) => l.startsWith('INVOICE_WRITTEN_OFF'))).toEqual([
      'INVOICE_WRITTEN_OFF id=1 amount=1.50',
      'INVOICE_WRITTEN_OFF id=2 amount=0.50',
    ]);
  });

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
    // 0.70 left is under $1.00, but more than 1% of 60.00 (0.60): it stays due
    await expect(page.getByTestId('invoice-amount-due')).toHaveText('$0.70');
    await expect(page.getByTestId('invoice-written-off')).toHaveText('$0.00');
    await expect(page.getByTestId('invoice-panel-status')).toHaveText('Part paid');
  });
});
