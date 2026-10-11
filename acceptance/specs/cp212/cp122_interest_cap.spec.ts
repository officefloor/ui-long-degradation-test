import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// UPDATED for cp212 (mutates: [57, 58, 66, 71, 73, 75, 84, 85, 94, 95, 99, 117, 122, 128, 143, 148,
// 149, 189]): instalment plans are gone; the instalment test is dropped. Carries the invoice test.
// A region can have a legal maximum interest rate (settings.regionMaxInterest, region -> annual %).
// Late interest for a client in that region is worked out at the lower of their usual rate (their
// own, else the workspace's) and the cap.
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
    await expect(page.getByTestId('invoice-interest')).toHaveText('$17.82');
    // Initech's own 18% is capped at New York's 9% too
    await page.getByTestId('client-row-3').click();
    await page.getByTestId('invoice-row-3').click();
    await expect(page.getByTestId('invoice-interest')).toHaveText('$13.34');
    await expect(page.getByTestId('client-row-3').getByTestId('client-overdue')).toHaveText('$1,013.34');
  });

});
