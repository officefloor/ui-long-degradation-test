import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// A milestone's amount is now its percentage of what the client pays (grand total less
// withholding), rounded down to the cent, except the last milestone, which takes whatever is left
// so they add up exactly.
test.describe('milestone shares rounded down', () => {
  test("rounds each milestone's share down and gives the last one the rest", { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-03-10',
      settings: { taxRate: 10 },
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      invoices: [
        { id: 1, clientId: 1, status: 'DRAFT', issueDate: '2026-03-01', dueDate: '2026-04-30',
          milestones: [
            { id: 1, description: 'Design', pct: 35 },
            { id: 2, description: 'Build', pct: 35 },
            { id: 3, description: 'Handover', pct: 30 },
          ],
          lineItems: [{ id: 1, description: 'Build', qty: 1, unitPrice: 3333.34 }] },
        { id: 2, clientId: 1, status: 'DRAFT', issueDate: '2026-03-01', dueDate: '2026-04-30',
          milestones: [
            { id: 4, description: 'Start', pct: 30 },
            { id: 5, description: 'Middle', pct: 30 },
            { id: 6, description: 'End', pct: 40 },
          ],
          lineItems: [{ id: 2, description: 'Build', qty: 1, unitPrice: 999.99 }] },
      ],
    });
    await page.goto('/');

    await page.getByTestId('client-row-1').click();
    await page.getByTestId('invoice-row-1').click();
    // 3,666.67 split 35/35/30: 1,283.3345 and 1,283.3345 round down to 1,283.33; the last takes
    // 3,666.67 - 2,566.66 = 1,100.01 (the largest remainder would have put the cent on the first)
    await expect(page.getByTestId('milestone-row-1').getByTestId('milestone-amount')).toHaveText('$1,283.33');
    await expect(page.getByTestId('milestone-row-2').getByTestId('milestone-amount')).toHaveText('$1,283.33');
    await expect(page.getByTestId('milestone-row-3').getByTestId('milestone-amount')).toHaveText('$1,100.01');
    // 1,099.99 split 30/30/40: 329.997 -> 329.99 twice, and the last 440.01
    await page.getByTestId('invoice-row-2').click();
    await expect(page.getByTestId('invoice-panel-number')).toHaveText(await page.getByTestId('invoice-row-2').getByTestId('invoice-number').innerText());
    await expect(page.getByTestId('milestone-row-4').getByTestId('milestone-amount')).toHaveText('$329.99');
    await expect(page.getByTestId('milestone-row-6').getByTestId('milestone-amount')).toHaveText('$440.01');
  });
});
