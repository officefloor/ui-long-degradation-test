import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';
import { auditLines } from '../support/audit';

// After a payment, what is left on an invoice is written off only when it is worth less than $0.05
// at the workspace rates (and no more than 1% of the grand total); anything else stays due.
test.describe('write off under five cents', () => {
  test('writes off only what is worth less than five cents', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-03-10',
      settings: { usdPer: { EUR: 1.1, GBP: 1.25, JPY: 0.0066, CHF: 1.13 } },
      clients: [
        { id: 1, name: 'Acme Ltd', email: 'ops@acme.example' },
        { id: 3, name: 'Kaisha KK', email: 'ap@kaisha.example', currency: 'JPY' },
      ],
      invoices: [
        { id: 1, clientId: 1, status: 'SENT', issueDate: '2026-03-01', dueDate: '2026-04-30',
          lineItems: [{ id: 1, description: 'Design', qty: 1, unitPrice: 100 }] },
        { id: 2, clientId: 1, status: 'SENT', issueDate: '2026-03-01', dueDate: '2026-04-30',
          lineItems: [{ id: 2, description: 'Design', qty: 1, unitPrice: 100 }] },
        { id: 3, clientId: 3, status: 'SENT', issueDate: '2026-03-01', dueDate: '2026-04-30',
          lineItems: [{ id: 3, description: 'Consulting', qty: 1, unitPrice: 5000 }] },
        { id: 4, clientId: 3, status: 'SENT', issueDate: '2026-03-01', dueDate: '2026-04-30',
          lineItems: [{ id: 4, description: 'Consulting', qty: 1, unitPrice: 5000 }] },
      ],
    });
    await page.goto('/');

    await page.getByTestId('client-row-1').click();
    const pays = [['1', '99.96'], ['2', '99.50']];
    for (const [id, amount] of pays) {
      await page.getByTestId(`invoice-row-${id}`).click();
      await page.getByTestId('payment-form-amount').fill(amount);
      await page.getByTestId('payment-form-date').fill('2026-03-10');
      await page.getByTestId('payment-form-submit').click();
    }
    // 0.04 left is under $0.05: written off
    await page.getByTestId('invoice-row-1').click();
    await expect(page.getByTestId('invoice-written-off')).toHaveText('$0.04');
    await expect(page.getByTestId('invoice-panel-status')).toHaveText('Paid');
    // 0.50 left now stays due
    await page.getByTestId('invoice-row-2').click();
    await expect(page.getByTestId('invoice-panel-number')).toHaveText(await page.getByTestId('invoice-row-2').getByTestId('invoice-number').innerText());
    await expect(page.getByTestId('invoice-amount-due')).toHaveText('$0.50');
    await expect(page.getByTestId('invoice-panel-status')).toHaveText('Part paid');
    // yen: 7 yen is worth 7 x 0.0066 = $0.046, written off; 8 yen is $0.053 and stays due
    await page.getByTestId('client-row-3').click();
    const yen = [['3', '4993'], ['4', '4992']];
    for (const [id, amount] of yen) {
      await page.getByTestId(`invoice-row-${id}`).click();
      await page.getByTestId('payment-form-amount').fill(amount);
      await page.getByTestId('payment-form-date').fill('2026-03-10');
      await page.getByTestId('payment-form-submit').click();
    }
    await page.getByTestId('invoice-row-3').click();
    await expect(page.getByTestId('invoice-panel-number')).toHaveText(await page.getByTestId('invoice-row-3').getByTestId('invoice-number').innerText());
    await expect(page.getByTestId('invoice-written-off')).toHaveText('¥7');
    await page.getByTestId('invoice-row-4').click();
    await expect(page.getByTestId('invoice-panel-number')).toHaveText(await page.getByTestId('invoice-row-4').getByTestId('invoice-number').innerText());
    await expect(page.getByTestId('invoice-amount-due')).toHaveText('¥8');
    await expect.poll(() => auditLines().filter((l) => l.startsWith('INVOICE_WRITTEN_OFF'))).toEqual([
      'INVOICE_WRITTEN_OFF id=1 amount=0.04',
      'INVOICE_WRITTEN_OFF id=3 amount=7',
    ]);
  });
});
