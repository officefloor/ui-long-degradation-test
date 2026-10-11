import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// UPDATED for cp176 (mutates: [155, 157, 165, 175]): a service period is now charged per day at the
// monthly amount x 12 / 365, so January 20 to February 10 costs 325.48 instead of 334.91, and a
// whole March 91.73 instead of 90.00. Carries both tests.
// A line can have a service period (lineItems[].periodStart and periodEnd, from the line form's
// period boxes; shown on the line as "<start> to <end>"). Its quantity x unit price is then the
// price for a whole month, and the line's amount is charged by the day: the day rate is the monthly
// amount x 12 / 365, times the days in the period (both ends included), rounded half up to the cent
// (whole yen) once. The line's own discount, the invoice discount and its split, tax and totals
// then work on that amount as usual. A period ending before it starts is refused.
test.describe('service periods', () => {
  test('prorates a service period by calendar days', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-03-10',
      settings: { taxRate: 10, approvalLimit: 1500 },
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      invoices: [
        { id: 1, clientId: 1, status: 'DRAFT', issueDate: '2026-03-01', dueDate: '2026-04-30',
          discountPct: 10,
          lineItems: [
            { id: 1, description: 'Support plan', qty: 1, unitPrice: 450, periodStart: '2026-01-20', periodEnd: '2026-02-10' },
            { id: 2, description: 'Setup', qty: 1, unitPrice: 120 },
          ] },
      ],
    });
    await page.goto('/');

    await page.getByTestId('client-row-1').click();
    await page.getByTestId('invoice-row-1').click();
    await expect(page.getByTestId('line-row-1').getByTestId('line-period')).toHaveText('2026-01-20 to 2026-02-10');
    // 450.00 a month is 450 x 12 / 365 = 14.7945 a day; 2026-01-20 to 2026-02-10 is 22 days:
    // 325.4795, rounded once to 325.48 (whole calendar months would give 334.91)
    await expect(page.getByTestId('line-row-1').getByTestId('line-amount')).toHaveText('$325.48');
    await expect(page.getByTestId('invoice-subtotal')).toHaveText('$445.48');
    // the 10% discount ($44.54) is shared over the lines in proportion
    await expect(page.getByTestId('invoice-discount')).toHaveText('$44.54');
    await expect(page.getByTestId('line-row-1').getByTestId('line-discount-share')).toHaveText('$32.54');
    await expect(page.getByTestId('invoice-tax')).toHaveText('$40.09');
    await expect(page.getByTestId('invoice-grand-total')).toHaveText('$441.03');
    await expect(page.getByTestId('invoice-approval')).toHaveText('Not needed');
    await page.getByTestId('line-form-description').fill('Hosting');
    await page.getByTestId('line-form-qty').fill('2');
    await page.getByTestId('line-form-unit-price').fill('600');
    await page.getByTestId('line-form-period-start').fill('2026-02-15');
    await page.getByTestId('line-form-period-end').fill('2026-03-14');
    await page.getByTestId('line-form-submit').click();
    // 1,200.00 a month for 2026-02-15 to 2026-03-14, 28 days at 1,200 x 12 / 365 a day = 1,104.6575
    // -> 1,104.66
    await expect(page.getByTestId('line-row-3').getByTestId('line-amount')).toHaveText('$1,104.66');
    await expect(page.getByTestId('invoice-grand-total')).toHaveText('$1,534.64');
    // now over the 1,500.00 approval limit
    await expect(page.getByTestId('invoice-approval')).toHaveText('Needs approval');
    await page.getByTestId('line-form-description').fill('Licences');
    await page.getByTestId('line-form-qty').fill('1');
    await page.getByTestId('line-form-unit-price').fill('90');
    await page.getByTestId('line-form-period-start').fill('2026-03-01');
    await page.getByTestId('line-form-period-end').fill('2026-03-31');
    await page.getByTestId('line-form-submit').click();
    // all of March, 31 days: 90 x 12 / 365 x 31 = 91.73, not 90.00
    await expect(page.getByTestId('line-row-4').getByTestId('line-amount')).toHaveText('$91.73');
    await expect(page.getByTestId('invoice-grand-total')).toHaveText('$1,625.46');
    // a period that ends before it starts is refused
    await page.getByTestId('line-form-description').fill('Licences');
    await page.getByTestId('line-form-qty').fill('1');
    await page.getByTestId('line-form-unit-price').fill('90');
    await page.getByTestId('line-form-period-start').fill('2026-03-31');
    await page.getByTestId('line-form-period-end').fill('2026-03-01');
    await page.getByTestId('line-form-submit').click();
    await expect(page.getByTestId('line-form-error')).toBeVisible();
    await expect(page.getByTestId(/^line-row-\d+$/)).toHaveCount(4);
  });

  test('prorates in whole yen', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-03-10',
      settings: { usdPer: { EUR: 1.1, GBP: 1.25, JPY: 0.0066, CHF: 1.13 } },
      clients: [{ id: 3, name: 'Kaisha KK', email: 'ap@kaisha.example', currency: 'JPY' }],
      invoices: [
        { id: 2, clientId: 3, status: 'DRAFT', issueDate: '2026-03-01', dueDate: '2026-04-30',
          lineItems: [
            { id: 5, description: 'Support plan', qty: 1, unitPrice: 50000, periodStart: '2026-02-20', periodEnd: '2026-03-05', discountPct: 5 },
          ] },
      ],
    });
    await page.goto('/');

    await page.getByTestId('client-row-3').click();
    await page.getByTestId('invoice-row-2').click();
    // 50,000 yen a month is 50,000 x 12 / 365 a day; 14 days: 23,013.70 -> 23,014, less its own 5% (1,150)
    await expect(page.getByTestId('line-row-5').getByTestId('line-amount')).toHaveText('¥21,864');
    await expect(page.getByTestId('invoice-grand-total')).toHaveText('¥21,864');
  });
});
