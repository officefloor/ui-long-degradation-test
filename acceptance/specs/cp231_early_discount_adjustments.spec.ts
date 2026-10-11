import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';
import { auditLines } from '../support/audit';

// An invoice's early-payment discount is worked out on its amount before tax less what its credit
// notes and credit adjustment notes take off before tax, so the settle amount follows. A debit
// adjustment note has no early-payment discount of its own.
test.describe('early discount and adjustment notes', () => {
  test('a credit note lowers the early-payment discount; a debit note gets none', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-06-10',
      settings: { taxRate: 10 },
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example', earlyPayPct: 2, earlyPayDays: 10 }],
      invoices: [
        { id: 1, clientId: 1, status: 'SENT', issueDate: '2026-06-05', dueDate: '2026-07-31',
          lineItems: [
            { id: 1, description: 'Build', qty: 1, unitPrice: 800 },
            { id: 2, description: 'Travel', qty: 1, unitPrice: 200 },
          ] },
      ],
    });
    await page.goto('/');

    await page.getByTestId('client-row-1').click();
    await page.getByTestId('invoice-row-1').click();
    // 2% of 1,000.00: 1,100.00 - 20.00
    await expect(page.getByTestId('invoice-settle-amount')).toHaveText('$1,080.00');
    await page.getByTestId('line-row-2').getByTestId('line-remove').click();
    // 2% of the 800.00 left: 16.00; 1,100.00 - 220.00 - 16.00
    await expect(page.getByTestId('invoice-settle-amount')).toHaveText('$864.00');
    await page.getByTestId('payment-form-amount').fill('864.00');
    await page.getByTestId('payment-form-date').fill('2026-06-10');
    await page.getByTestId('payment-form-submit').click();
    await expect(page.getByTestId('invoice-panel-status')).toHaveText('Paid');
    await expect.poll(() => auditLines()).toContain('EARLY_DISCOUNT id=1 amount=16.00');
    await page.getByTestId('line-form-description').fill('Extra');
    await page.getByTestId('line-form-qty').fill('1');
    await page.getByTestId('line-form-unit-price').fill('50');
    await page.getByTestId('line-form-submit').click();
    // the debit note is owed in full: no early discount on it
    await page.getByTestId('invoice-row-3').click();
    await expect(page.getByTestId('invoice-panel-number')).toHaveText(await page.getByTestId('invoice-row-3').getByTestId('invoice-number').innerText());
    await expect(page.getByTestId('invoice-settle-amount')).toHaveCount(0);
    await expect(page.getByTestId('invoice-amount-due')).toHaveText('$55.00');
  });
});
