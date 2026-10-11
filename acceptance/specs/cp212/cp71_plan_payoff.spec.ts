import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';
import { auditLines } from '../support/audit';

// UPDATED for cp212 (mutates: [57, 58, 66, 71, 73, 75, 84, 85, 94, 95, 99, 117, 122, 128, 143, 148,
// 149, 189]): instalment plans are gone; there is no plan to pay off early, so both tests are
// replaced by one showing the amount due settling the invoice. Carries none of the earlier tests.
// There are no instalment plans, so no payoff figure, interest saved or PLAN_SETTLED: paying the
// amount due settles an invoice.
test.describe('paying off a plan early', () => {
  test('there is no plan to pay off: paying the amount due settles the invoice', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-03-10',
      settings: { taxRate: 10 },
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      invoices: [
        { id: 1, clientId: 1, status: 'SENT', issueDate: '2026-03-01', dueDate: '2026-04-30',
          lineItems: [{ id: 1, description: 'Build', qty: 1, unitPrice: 900 }] },
      ],
    });
    await page.goto('/');

    await page.getByTestId('client-row-1').click();
    await page.getByTestId('invoice-row-1').click();
    await expect(page.getByTestId('plan-form-count')).toHaveCount(0);
    await expect(page.getByTestId('plan-form-rate')).toHaveCount(0);
    await expect(page.getByTestId('plan-form-submit')).toHaveCount(0);
    await expect(page.getByTestId('invoice-plan-total')).toHaveCount(0);
    await expect(page.getByTestId(/^instalment-row-\d+$/)).toHaveCount(0);
    await expect(page.getByTestId('invoice-payoff')).toHaveCount(0);
    await expect(page.getByTestId('invoice-interest-saved')).toHaveCount(0);
    await page.getByTestId('payment-form-amount').fill('990');
    await page.getByTestId('payment-form-date').fill('2026-03-10');
    await page.getByTestId('payment-form-submit').click();
    await expect(page.getByTestId('invoice-panel-status')).toHaveText('Paid');
    await expect(page.getByTestId('invoice-amount-due')).toHaveText('$0.00');
    expect(auditLines().filter((l) => l.startsWith('PLAN_SETTLED'))).toEqual([]);
  });
});
