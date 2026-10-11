import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// A region can set a statutory grace period (settings.regionGraceDays, region -> days). A client in
// that region without a grace period of their own gets it instead of the usual 7 days, for when
// their invoices, instalments and released retention become overdue and when late interest starts.
test.describe('regional grace periods', () => {
  test("gives a region's statutory grace period", { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-03-20',
      settings: { lateInterestRate: 12, regionGraceDays: { NY: 30, OR: 0 } },
      clients: [
        { id: 1, name: 'Acme Ltd', email: 'ops@acme.example', region: 'NY' },
        { id: 2, name: 'Globex Corp', email: 'billing@globex.example', region: 'OR' },
        { id: 3, name: 'Initech', email: 'ap@initech.example', region: 'NY', graceDays: 3 },
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

    // New York gives 30 days: due 2026-03-01, not overdue until after 2026-03-31
    await page.getByTestId('client-row-1').click();
    await expect(page.getByTestId('invoice-row-1').getByTestId('invoice-status')).toHaveText('Sent');
    await page.getByTestId('invoice-row-1').click();
    await expect(page.getByTestId('invoice-interest')).toHaveText('$0.00');
    // Oregon gives none: interest from the due date, 19 days on 1,000.00 at 12%
    await page.getByTestId('client-row-2').click();
    await expect(page.getByTestId('invoice-row-2').getByTestId('invoice-status')).toHaveText('Overdue');
    await page.getByTestId('invoice-row-2').click();
    await expect(page.getByTestId('invoice-panel-number')).toHaveText(await page.getByTestId('invoice-row-2').getByTestId('invoice-number').innerText());
    await expect(page.getByTestId('invoice-interest')).toHaveText('$6.35');
    await expect(page.getByTestId('client-row-2').getByTestId('client-overdue')).toHaveText('$1,006.35');
    // a client's own grace still wins: Initech's 3 days, 16 days of interest
    await page.getByTestId('client-row-3').click();
    await page.getByTestId('invoice-row-3').click();
    await expect(page.getByTestId('invoice-panel-number')).toHaveText(await page.getByTestId('invoice-row-3').getByTestId('invoice-number').innerText());
    await expect(page.getByTestId('invoice-panel-status')).toHaveText('Overdue');
    await expect(page.getByTestId('invoice-interest')).toHaveText('$5.35');
  });
});
