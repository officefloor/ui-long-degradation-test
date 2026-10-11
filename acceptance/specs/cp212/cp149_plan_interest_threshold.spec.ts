import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// UPDATED for cp212 (mutates: [57, 58, 66, 71, 73, 75, 84, 85, 94, 95, 99, 117, 122, 128, 143, 148,
// 149, 189]): instalment plans are gone; there are no plans, so the test is replaced by one of an
// invoice's interest waiting for the threshold. Carries none of the earlier tests.
// There are no instalment plans; an invoice's late interest is not shown or owed until it reaches
// the interest threshold.
test.describe('interest threshold on plans', () => {
  test("an invoice's late interest waits for the threshold", { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-03-10',
      settings: { taxRate: 10, lateInterestRate: 12, interestThreshold: 5 },
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      invoices: [
        { id: 1, clientId: 1, status: 'SENT', issueDate: '2026-02-01', dueDate: '2026-02-28',
          lineItems: [{ id: 1, description: 'Build', qty: 1, unitPrice: 400 }] },
        { id: 2, clientId: 1, status: 'SENT', issueDate: '2026-01-01', dueDate: '2026-01-31',
          lineItems: [{ id: 2, description: 'Build', qty: 1, unitPrice: 1000 }] },
      ],
    });
    await page.goto('/');

    await page.getByTestId('client-row-1').click();
    await expect(page.getByTestId('plan-form-count')).toHaveCount(0);
    await expect(page.getByTestId('plan-form-rate')).toHaveCount(0);
    await expect(page.getByTestId('plan-form-submit')).toHaveCount(0);
    await expect(page.getByTestId('invoice-plan-total')).toHaveCount(0);
    await expect(page.getByTestId(/^instalment-row-\d+$/)).toHaveCount(0);
    // 440.00 for 3 days: under 5.00, so none yet
    await page.getByTestId('invoice-row-1').click();
    await expect(page.getByTestId('invoice-interest')).toHaveText('$0.00');
    // 1,100.00 for 31 days is over it
    await page.getByTestId('invoice-row-2').click();
    await expect(page.getByTestId('invoice-panel-number')).toHaveText(await page.getByTestId('invoice-row-2').getByTestId('invoice-number').innerText());
    await expect(page.getByTestId('invoice-interest')).toHaveText('$11.42');
  });
});
