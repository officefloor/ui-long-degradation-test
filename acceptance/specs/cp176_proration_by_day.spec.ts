import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// A line with a service period is now charged by the day: the day rate is the monthly amount x 12 /
// 365, times the days in the period (both ends included), rounded half up to the cent (whole yen)
// once. A whole calendar month therefore costs 28, 30 or 31 days' worth, not the monthly amount.
test.describe('proration by the day', () => {
  test('charges a service period by the day', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-03-10',
      settings: { taxRate: 10 },
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      invoices: [
        { id: 1, clientId: 1, status: 'DRAFT', issueDate: '2026-03-01', dueDate: '2026-04-30',
          lineItems: [
            { id: 1, description: 'Support plan', qty: 1, unitPrice: 450, periodStart: '2026-01-20', periodEnd: '2026-02-10' },
            { id: 2, description: 'Hosting', qty: 1, unitPrice: 90, periodStart: '2026-03-01', periodEnd: '2026-03-31' },
            { id: 3, description: 'Hosting', qty: 1, unitPrice: 90, periodStart: '2026-02-01', periodEnd: '2026-02-28' },
          ] },
      ],
    });
    await page.goto('/');

    await page.getByTestId('client-row-1').click();
    await page.getByTestId('invoice-row-1').click();
    // 450.00 a month is 450 x 12 / 365 = 14.794521 a day: 22 days = 325.479452 -> 325.48
    // (by calendar month it was 334.91)
    await expect(page.getByTestId('line-row-1').getByTestId('line-amount')).toHaveText('$325.48');
    // a whole month is no longer the monthly price: 31 days of March = 91.73, 28 days of February = 82.85
    await expect(page.getByTestId('line-row-2').getByTestId('line-amount')).toHaveText('$91.73');
    await expect(page.getByTestId('line-row-3').getByTestId('line-amount')).toHaveText('$82.85');
    await expect(page.getByTestId('invoice-grand-total')).toHaveText('$550.07');
  });
});
