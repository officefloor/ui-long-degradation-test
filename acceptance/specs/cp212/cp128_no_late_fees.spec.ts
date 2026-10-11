import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';
import { auditLines } from '../support/audit';

// UPDATED for cp212 (mutates: [57, 58, 66, 71, 73, 75, 84, 85, 94, 95, 99, 117, 122, 128, 143, 148,
// 149, 189]): instalment plans are gone; the instalment test is dropped. Carries the invoice test.
// No late fee is charged any more: the late fee figures are gone from the panel, and the workspace
// has no late fee setting. Overdue invoices still earn late interest; a payment pays what the
// invoice owes first, then the interest, and waiving writes off the unpaid interest.
test.describe('no more late fees', () => {
  test('an overdue invoice is charged interest but no late fee', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-04-30',
      settings: { lateInterestRate: 12 },
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      invoices: [
        { id: 1, clientId: 1, status: 'SENT', issueDate: '2026-02-01', dueDate: '2026-03-01',
          lineItems: [{ id: 1, description: 'Build', qty: 1, unitPrice: 1000 }] },
      ],
    });
    await page.goto('/');

    await page.getByTestId('client-row-1').click();
    await page.getByTestId('invoice-row-1').click();
    // overdue since 2026-03-09: interest on the 1,000.00 from the end of grace (53 days), no fee
    await expect(page.getByTestId('invoice-late-fee')).toHaveCount(0);
    await expect(page.getByTestId('invoice-interest')).toHaveText('$17.82');
    await expect(page.getByTestId('invoice-amount-due')).toHaveText('$1,017.82'); // 1,000.00 + 17.82
    await expect(page.getByTestId('client-row-1').getByTestId('client-overdue')).toHaveText('$1,017.82');
    // a payment pays the invoice first, then the interest
    await page.getByTestId('payment-form-amount').fill('500');
    await page.getByTestId('payment-form-date').fill('2026-04-30');
    await page.getByTestId('payment-form-submit').click();
    await expect(page.getByTestId('invoice-amount-due')).toHaveText('$517.82'); // 500.00 + 17.82
    // waiving writes off the interest alone
    await page.getByTestId('invoice-waive').click();
    await expect.poll(() => auditLines()).toContain('INTEREST_WAIVED id=1 amount=17.82');
    await expect(page.getByTestId('invoice-amount-due')).toHaveText('$500.00');
  });

});
