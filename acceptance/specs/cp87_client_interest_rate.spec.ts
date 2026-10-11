import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// A client can have their own late-interest rate (clients[].interestRate, 0 to 30 with up to two
// decimals, set when adding the client) used instead of the workspace rate; 0 means they are never
// charged late interest. Everything else about late interest is unchanged.
test.describe("clients' own interest rate", () => {
  test("charges each client's own interest rate", { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-04-30',
      settings: { lateInterestRate: 12 },
      clients: [
        { id: 1, name: 'Acme Ltd', email: 'ops@acme.example', interestRate: 18 },
        { id: 2, name: 'Globex Corp', email: 'billing@globex.example', interestRate: 0 },
        { id: 3, name: 'Initech', email: 'ap@initech.example' },
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

    // all three owe 1,000.00, due 2026-03-01: 53 days of interest from the end of the grace week
    await page.getByTestId('client-row-1').click();
    await page.getByTestId('invoice-row-1').click();
    await expect(page.getByTestId('invoice-interest')).toHaveText('$26.85'); // at 18%: 1,000.00 x ((1 + 0.18/360)^53 - 1)
    await page.getByTestId('client-row-2').click();
    await page.getByTestId('invoice-row-2').click();
    await expect(page.getByTestId('invoice-panel-number')).toHaveText(await page.getByTestId('invoice-row-2').getByTestId('invoice-number').innerText());
    await expect(page.getByTestId('invoice-interest')).toHaveText('$0.00'); // 0%: no interest
    await expect(page.getByTestId('invoice-panel-status')).toHaveText('Overdue');
    await page.getByTestId('client-row-3').click();
    await page.getByTestId('invoice-row-3').click();
    await expect(page.getByTestId('invoice-panel-number')).toHaveText(await page.getByTestId('invoice-row-3').getByTestId('invoice-number').innerText());
    await expect(page.getByTestId('invoice-interest')).toHaveText('$17.82'); // the workspace's 12%
  });

  test('sets an interest rate when adding a client', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-04-30',
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
    });
    await page.goto('/');

    await page.getByTestId('client-form-name').fill('Initech');
    await page.getByTestId('client-form-email').fill('ap@initech.example');
    await page.getByTestId('client-form-interest-rate').fill('30.01');
    await page.getByTestId('client-form-submit').click();
    await expect(page.getByTestId('client-form-error')).toBeVisible();
    await page.getByTestId('client-form-interest-rate').fill('8.5');
    await page.getByTestId('client-form-submit').click();
    await expect(page.getByTestId('client-row-2').getByTestId('client-name')).toHaveText('Initech');
  });
});
