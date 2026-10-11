import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// UPDATED for cp80 (mutates: [63, 65, 66, 68, 70, 78]): late interest now uses an Actual/360 day
// count, so the interest on the overdue invoices is higher. Carries both tests.
// A client can have their own grace period in days (clients[].graceDays, 0 to 30, set when adding
// the client) instead of the standard 7: their invoices and instalments become Overdue, start
// earning late interest and are charged the late fee only once that many days have passed since the
// due date.
test.describe("clients' own grace period", () => {
  test("uses each client's own grace period", { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-04-20',
      settings: { lateInterestRate: 12 },
      clients: [
        { id: 1, name: 'Acme Ltd', email: 'ops@acme.example', graceDays: 0 },
        { id: 2, name: 'Globex Corp', email: 'billing@globex.example', graceDays: 21 },
      ],
      invoices: [
        { id: 1, clientId: 1, status: 'SENT', issueDate: '2026-03-15', dueDate: '2026-04-15',
          lineItems: [{ id: 1, description: 'Design', qty: 1, unitPrice: 1000 }] },
        { id: 2, clientId: 2, status: 'SENT', issueDate: '2026-03-01', dueDate: '2026-04-01',
          lineItems: [{ id: 2, description: 'Design', qty: 1, unitPrice: 1000 }] },
        { id: 3, clientId: 2, status: 'SENT', issueDate: '2026-02-25', dueDate: '2026-03-25',
          lineItems: [{ id: 3, description: 'Design', qty: 1, unitPrice: 1000 }] },
      ],
    });
    await page.goto('/');

    // Acme has no grace: due 2026-04-15, overdue since, interest for 5 days: 1,000.00 x ((1 + 0.12/360)^5 - 1)
    await expect(page.getByTestId('client-row-1').getByTestId('client-overdue')).toHaveText('$1,001.67');
    await page.getByTestId('client-row-1').click();
    await expect(page.getByTestId('invoice-row-1').getByTestId('invoice-status')).toHaveText('Overdue');
    await page.getByTestId('invoice-row-1').click();
    await expect(page.getByTestId('invoice-interest')).toHaveText('$1.67');
    // Globex has 21 days: invoice 2 (19 days late) is not overdue and earns nothing yet
    await page.getByTestId('client-row-2').click();
    await expect(page.getByTestId('invoice-row-2').getByTestId('invoice-status')).toHaveText('Sent');
    await page.getByTestId('invoice-row-2').click();
    await expect(page.getByTestId('invoice-panel-number')).toHaveText(await page.getByTestId('invoice-row-2').getByTestId('invoice-number').innerText());
    await expect(page.getByTestId('invoice-interest')).toHaveText('$0.00');
    // invoice 3 (26 days late) is overdue, with interest from 2026-04-15, 21 days after its due date
    await expect(page.getByTestId('invoice-row-3').getByTestId('invoice-status')).toHaveText('Overdue');
    await page.getByTestId('invoice-row-3').click();
    await expect(page.getByTestId('invoice-panel-number')).toHaveText(await page.getByTestId('invoice-row-3').getByTestId('invoice-number').innerText());
    await expect(page.getByTestId('invoice-interest')).toHaveText('$1.67');
    await expect(page.getByTestId('client-row-2').getByTestId('client-overdue')).toHaveText('$1,001.67');
  });

  test('sets a grace period when adding a client', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-04-20',
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
    });
    await page.goto('/');

    await page.getByTestId('client-form-name').fill('Initech');
    await page.getByTestId('client-form-email').fill('ap@initech.example');
    await page.getByTestId('client-form-grace-days').fill('31');
    await page.getByTestId('client-form-submit').click();
    await expect(page.getByTestId('client-form-error')).toBeVisible();
    await page.getByTestId('client-form-grace-days').fill('14');
    await page.getByTestId('client-form-submit').click();
    await expect(page.getByTestId('client-row-2').getByTestId('client-name')).toHaveText('Initech');
  });
});
