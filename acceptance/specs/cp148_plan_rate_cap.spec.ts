import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// A region's legal maximum interest rate now also caps the rate of an instalment plan for a client
// in that region: the plan is worked out at the lower of its own rate and the cap.
test.describe('plan rates capped', () => {
  test("caps an instalment plan's rate at the region's maximum", { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-01-31',
      settings: { lateInterestRate: 12, regionMaxInterest: { NY: 9 } },
      clients: [
        { id: 1, name: 'Acme Ltd', email: 'ops@acme.example', region: 'NY' },
        { id: 2, name: 'Globex Corp', email: 'billing@globex.example', region: 'CA' },
      ],
      invoices: [
        { id: 1, clientId: 1, status: 'DRAFT', issueDate: '2026-01-31', dueDate: '2026-02-28',
          lineItems: [{ id: 1, description: 'Consulting', qty: 1, unitPrice: 1000 }] },
        { id: 2, clientId: 2, status: 'DRAFT', issueDate: '2026-01-31', dueDate: '2026-02-28',
          lineItems: [{ id: 2, description: 'Consulting', qty: 1, unitPrice: 1000 }] },
      ],
    });
    await page.goto('/');

    await page.getByTestId('client-row-1').click();
    await page.getByTestId('invoice-row-1').click();
    await page.getByTestId('plan-form-count').fill('3');
    await page.getByTestId('plan-form-rate').fill('12');
    await page.getByTestId('plan-form-submit').click();
    // New York allows 9%: 1,000.00 x 0.0075 / (1 - 1.0075^-3) = 338.34, rounded up to 339.00
    await expect(page.getByTestId('instalment-row-1').getByTestId('instalment-due')).toHaveText('2026-02-28');
    await expect(page.getByTestId('instalment-row-1').getByTestId('instalment-payment')).toHaveText('$339.00');
    await expect(page.getByTestId('instalment-row-1').getByTestId('instalment-interest')).toHaveText('$7.50');
    await expect(page.getByTestId('instalment-row-1').getByTestId('instalment-principal')).toHaveText('$331.50');
    await expect(page.getByTestId('instalment-row-1').getByTestId('instalment-balance')).toHaveText('$668.50');
    await expect(page.getByTestId('instalment-row-2').getByTestId('instalment-due')).toHaveText('2026-03-31');
    await expect(page.getByTestId('instalment-row-2').getByTestId('instalment-payment')).toHaveText('$339.00');
    await expect(page.getByTestId('instalment-row-2').getByTestId('instalment-interest')).toHaveText('$5.01');
    await expect(page.getByTestId('instalment-row-2').getByTestId('instalment-principal')).toHaveText('$333.99');
    await expect(page.getByTestId('instalment-row-2').getByTestId('instalment-balance')).toHaveText('$334.51');
    await expect(page.getByTestId('instalment-row-3').getByTestId('instalment-due')).toHaveText('2026-04-30');
    await expect(page.getByTestId('instalment-row-3').getByTestId('instalment-payment')).toHaveText('$337.02');
    await expect(page.getByTestId('instalment-row-3').getByTestId('instalment-interest')).toHaveText('$2.51');
    await expect(page.getByTestId('instalment-row-3').getByTestId('instalment-principal')).toHaveText('$334.51');
    await expect(page.getByTestId('instalment-row-3').getByTestId('instalment-balance')).toHaveText('$0.00');
    await expect(page.getByTestId('invoice-plan-total')).toHaveText('$1,015.02');
    // California has no cap: 12%, 340.02 rounded up to 341.00
    await page.getByTestId('client-row-2').click();
    await page.getByTestId('invoice-row-2').click();
    await expect(page.getByTestId('invoice-panel-number')).toHaveText(await page.getByTestId('invoice-row-2').getByTestId('invoice-number').innerText());
    await page.getByTestId('plan-form-count').fill('3');
    await page.getByTestId('plan-form-rate').fill('12');
    await page.getByTestId('plan-form-submit').click();
    await expect(page.getByTestId('instalment-row-1').getByTestId('instalment-payment')).toHaveText('$341.00');
    await expect(page.getByTestId('invoice-plan-total')).toHaveText('$1,020.04');
  });
});
