import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// A region can have standard payment terms (settings.regionTermsDays, region -> days). A client in
// that region with no terms of their own gets invoices due that many days after the issue date (new
// invoices, and again when sent), instead of the end of the next month.
test.describe('regional payment terms', () => {
  test("sets the due date from the client's region's terms", { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-03-10',
      settings: { taxRate: 10, regionTermsDays: { NY: 45 } },
      clients: [
        { id: 1, name: 'Acme Ltd', email: 'ops@acme.example', region: 'NY' },
        { id: 2, name: 'Globex Corp', email: 'billing@globex.example', region: 'NY', termsDays: 14 },
        { id: 3, name: 'Initech', email: 'ap@initech.example', region: 'CA' },
      ],
      invoices: [
        { id: 1, clientId: 1, status: 'DRAFT', issueDate: '2026-03-01', dueDate: '2026-03-31',
          lineItems: [{ id: 1, description: 'Design', qty: 1, unitPrice: 100 }] },
        { id: 2, clientId: 2, status: 'DRAFT', issueDate: '2026-03-01', dueDate: '2026-03-15',
          lineItems: [{ id: 2, description: 'Design', qty: 1, unitPrice: 100 }] },
        { id: 3, clientId: 3, status: 'DRAFT', issueDate: '2026-03-01', dueDate: '2026-04-30',
          lineItems: [{ id: 3, description: 'Design', qty: 1, unitPrice: 100 }] },
      ],
    });
    await page.goto('/');

    // sent today, 2026-03-10: New York gives 45 days, due 2026-04-24
    await page.getByTestId('client-row-1').click();
    await page.getByTestId('invoice-row-1').click();
    await page.getByTestId('invoice-send').click();
    await expect(page.getByTestId('invoice-row-1').getByTestId('invoice-due')).toHaveText('2026-04-24');
    // the client's own 14 days win: 2026-03-24
    await page.getByTestId('client-row-2').click();
    await page.getByTestId('invoice-row-2').click();
    await expect(page.getByTestId('invoice-panel-number')).toHaveText(await page.getByTestId('invoice-row-2').getByTestId('invoice-number').innerText());
    await page.getByTestId('invoice-send').click();
    await expect(page.getByTestId('invoice-row-2').getByTestId('invoice-due')).toHaveText('2026-03-24');
    // California has no terms: the end of next month
    await page.getByTestId('client-row-3').click();
    await page.getByTestId('invoice-row-3').click();
    await expect(page.getByTestId('invoice-panel-number')).toHaveText(await page.getByTestId('invoice-row-3').getByTestId('invoice-number').innerText());
    await page.getByTestId('invoice-send').click();
    await expect(page.getByTestId('invoice-row-3').getByTestId('invoice-due')).toHaveText('2026-04-30');
    // a new invoice for a New York client starts with the region's terms
    await page.getByTestId('client-row-1').click();
    await page.getByTestId('invoice-new').click();
    await expect(page.getByTestId('invoice-row-4').getByTestId('invoice-due')).toHaveText('2026-04-24');
  });

  test("sending re-dates the due date by the region's terms", { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-05-01',
      settings: { lateInterestRate: 12, regionTermsDays: { NY: 45 } },
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example', region: 'NY' }],
      invoices: [
        { id: 5, clientId: 1, status: 'DRAFT', issueDate: '2026-03-10', dueDate: '2026-04-24',
          lineItems: [{ id: 1, description: 'Build', qty: 1, unitPrice: 1000 }] },
      ],
    });
    await page.goto('/');

    await page.getByTestId('client-row-1').click();
    await page.getByTestId('invoice-row-5').click();
    await page.getByTestId('invoice-send').click();
    // issued 2026-05-01: 45 days on is 2026-06-15, so it is not overdue and earns no interest
    await expect(page.getByTestId('invoice-row-5').getByTestId('invoice-due')).toHaveText('2026-06-15');
    await expect(page.getByTestId('invoice-panel-status')).toHaveText('Sent');
    await expect(page.getByTestId('invoice-interest')).toHaveText('$0.00');
  });
});
