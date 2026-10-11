import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';
import { auditLines } from '../support/audit';

// The amount due in cash is now always rounded down to the 0.05 below, in the client's favour,
// never up; a cash payment of that amount settles the invoice with the (negative) cash rounding,
// and nothing is written off.
test.describe('cash rounds down', () => {
  test("cash always rounds down in the client's favour", { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-03-10',
      settings: { taxRate: 10 },
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      invoices: [
        { id: 1, clientId: 1, status: 'SENT', issueDate: '2026-03-01', dueDate: '2026-04-30',
          lineItems: [{ id: 1, description: 'Beans', qty: 1, unitPrice: 11.25 }] },
        { id: 2, clientId: 1, status: 'SENT', issueDate: '2026-03-01', dueDate: '2026-04-30',
          lineItems: [{ id: 2, description: 'Beans', qty: 1, unitPrice: 11.22 }] },
      ],
    });
    await page.goto('/');

    await page.getByTestId('client-row-1').click();
    await page.getByTestId('invoice-row-1').click();
    // 12.38 in cash is 12.35 (half up would give 12.40)
    await expect(page.getByTestId('invoice-cash-due')).toHaveText('$12.35');
    await expect(page.getByTestId('invoice-cash-rounding')).toHaveText('-$0.03');
    await page.getByTestId('payment-form-method').selectOption('CASH');
    await page.getByTestId('payment-form-amount').fill('12.35');
    await page.getByTestId('payment-form-date').fill('2026-03-10');
    await page.getByTestId('payment-form-submit').click();
    await expect(page.getByTestId('invoice-panel-status')).toHaveText('Paid');
    await expect(page.getByTestId('invoice-amount-due')).toHaveText('$0.00');
    await expect.poll(() => auditLines()).toContain('CASH_ROUNDING id=1 amount=-0.03');
    // a cash rounding, not a small balance written off
    expect(auditLines().filter((l) => l.startsWith('INVOICE_WRITTEN_OFF'))).toEqual([]);
    await expect(page.getByTestId('invoice-written-off')).toHaveText('$0.00');
    // 11.22 + 1.12 = 12.34 in cash is 12.30
    await page.getByTestId('invoice-row-2').click();
    await expect(page.getByTestId('invoice-panel-number')).toHaveText(await page.getByTestId('invoice-row-2').getByTestId('invoice-number').innerText());
    await expect(page.getByTestId('invoice-cash-due')).toHaveText('$12.30');
    await expect(page.getByTestId('invoice-cash-rounding')).toHaveText('-$0.04');
  });
});
