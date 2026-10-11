import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// A region can have a legal maximum interest rate (settings.regionMaxInterest, region -> annual %).
// Late interest for a client in that region, on invoices, instalments and released retention, is
// worked out at the lower of their usual rate (their own, else the workspace's) and the cap.
test.describe('interest cap by region', () => {
  test("caps late interest at the region's legal maximum", { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-04-30',
      settings: { lateInterestRate: 12, regionMaxInterest: { NY: 9 } },
      clients: [
        { id: 1, name: 'Acme Ltd', email: 'ops@acme.example', region: 'NY' },
        { id: 2, name: 'Globex Corp', email: 'billing@globex.example', region: 'CA' },
        { id: 3, name: 'Initech', email: 'ap@initech.example', region: 'NY', interestRate: 18 },
      ],
      invoices: [
        { id: 1, clientId: 1, status: 'SENT', issueDate: '2026-02-01', dueDate: '2026-03-01',
          lineItems: [{ id: 1, description: 'Build', qty: 1, unitPrice: 1000 }] },
        { id: 2, clientId: 2, status: 'SENT', issueDate: '2026-02-01', dueDate: '2026-03-01',
          lineItems: [{ id: 2, description: 'Build', qty: 1, unitPrice: 1000 }] },
        { id: 3, clientId: 3, status: 'SENT', issueDate: '2026-02-01', dueDate: '2026-03-01',
          lineItems: [{ id: 3, description: 'Build', qty: 1, unitPrice: 1000 }] },
      ],
    });
    await page.goto('/');

    await page.getByTestId('client-row-1').click();
    await page.getByTestId('invoice-row-1').click();
    // New York allows at most 9%: 1,000.00 x ((1 + 0.09/360)^53 - 1) from the end of grace (2026-03-08)
    await expect(page.getByTestId('invoice-interest')).toHaveText('$13.34');
    await expect(page.getByTestId('invoice-amount-due')).toHaveText('$1,013.34');
    // California has no cap: the workspace's 12%
    await page.getByTestId('client-row-2').click();
    await page.getByTestId('invoice-row-2').click();
    await expect(page.getByTestId('invoice-panel-number')).toHaveText(await page.getByTestId('invoice-row-2').getByTestId('invoice-number').innerText());
    await expect(page.getByTestId('invoice-interest')).toHaveText('$17.82');
    // Initech's own 18% is capped at New York's 9% too
    await page.getByTestId('client-row-3').click();
    await page.getByTestId('invoice-row-3').click();
    await expect(page.getByTestId('invoice-panel-number')).toHaveText(await page.getByTestId('invoice-row-3').getByTestId('invoice-number').innerText());
    await expect(page.getByTestId('invoice-interest')).toHaveText('$13.34');
    await expect(page.getByTestId('client-row-3').getByTestId('client-overdue')).toHaveText('$1,013.34');
  });

  test('an overdue instalment earns interest at the capped rate', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-04-30',
      settings: { lateInterestRate: 12, regionMaxInterest: { NY: 9 } },
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example', region: 'NY' }],
      invoices: [
        { id: 4, clientId: 1, status: 'SENT', issueDate: '2026-01-31', dueDate: '2026-02-28', instalments: 3,
          instalmentRate: 12,
          lineItems: [{ id: 1, description: 'Consulting', qty: 1, unitPrice: 1000 }] },
      ],
      payments: [
        { id: 1, clientId: 1, amount: 341, date: '2026-02-27', allocations: [{ invoiceId: 4, amount: 341 }] },
      ],
    });
    await page.goto('/');

    await page.getByTestId('client-row-1').click();
    await page.getByTestId('invoice-row-4').click();
    // the plan's own 12% stays: 340.0221 rounded up to 341.00
    await expect(page.getByTestId('instalment-row-1').getByTestId('instalment-payment')).toHaveText('$341.00');
    await expect(page.getByTestId('instalment-row-2').getByTestId('instalment-interest')).toHaveText('$6.69');
    // instalment 2 (due 2026-03-31) is overdue from 2026-04-07: late interest at New York's 9%
    await expect(page.getByTestId('instalment-row-2').getByTestId('instalment-late-interest')).toHaveText('$1.97');
    await expect(page.getByTestId('invoice-interest')).toHaveText('$1.97');
    await expect(page.getByTestId('client-row-1').getByTestId('client-overdue')).toHaveText('$342.97');
  });
});
