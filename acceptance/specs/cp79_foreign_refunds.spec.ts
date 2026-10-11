import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';
import { auditLines } from '../support/audit';

// A refund can be paid out in another currency (the refund form's currency, the client's own by
// default): the amount entered is in that currency and comes off the client's credit converted into
// their currency through US dollars at the rates on the refund date, rounded half up to their
// currency's step; CREDIT_REFUNDED shows the amount in the client's currency. A refund whose
// converted amount is more than the credit is refused.
test.describe('refunds in another currency', () => {
  test('refunds credit in another currency', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-03-10',
      settings: { usdPer: { EUR: 1.1, GBP: 1.25, JPY: 0.0066, CHF: 1.13 } },
      clients: [
        { id: 5, name: 'Helvetia AG', email: 'ap@helvetia.example', currency: 'CHF' },
        { id: 3, name: 'Kaisha KK', email: 'ap@kaisha.example', currency: 'JPY' },
      ],
      payments: [
        { id: 1, clientId: 5, amount: 100, date: '2026-03-01', allocations: [] },
        { id: 2, clientId: 3, amount: 10000, date: '2026-03-01', allocations: [] },
      ],
    });
    await page.goto('/');

    await page.getByTestId('client-row-5').click();
    await page.getByTestId('refund-form-currency').selectOption('EUR');
    await page.getByTestId('refund-form-amount').fill('40');
    await page.getByTestId('refund-form-date').fill('2026-03-09');
    await page.getByTestId('refund-form-submit').click();
    // 40 x 1.10 / 1.13 = 38.938... half up to CHF 0.05 comes off the CHF 100.00 credit
    await expect.poll(() => auditLines()).toContain('CREDIT_REFUNDED payment=1 amount=38.95');
    await expect(page.getByTestId('client-row-5').getByTestId('client-credit')).toHaveText('CHF 61.05');
    await page.getByTestId('client-row-3').click();
    await page.getByTestId('refund-form-currency').selectOption('USD');
    await page.getByTestId('refund-form-amount').fill('30');
    await page.getByTestId('refund-form-date').fill('2026-03-09');
    await page.getByTestId('refund-form-submit').click();
    // 30 / 0.0066 = 4,545.45 -> whole yen
    await expect.poll(() => auditLines()).toContain('CREDIT_REFUNDED payment=2 amount=4545');
    await expect(page.getByTestId('client-row-3').getByTestId('client-credit')).toHaveText('¥5,455');
    // $100 would be 15,152 yen, more than the credit left
    await page.getByTestId('refund-form-amount').fill('100');
    await page.getByTestId('refund-form-submit').click();
    await expect(page.getByTestId('refund-form-error')).toBeVisible();
    await expect(page.getByTestId('client-row-3').getByTestId('client-credit')).toHaveText('¥5,455');
  });
});
