import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// How long an approval lasts depends on the client's tier: 90 days for KEY clients, 7 days for NEW
// clients and 30 days for everyone else, counted from the day it was given.
test.describe('approvals that last by tier', () => {
  test("an approval lasts as long as the client's tier allows", { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-03-10',
      settings: { approvalLimit: 1000 },
      clients: [
        { id: 1, name: 'Acme Ltd', email: 'ops@acme.example', tier: 'KEY' },
        { id: 2, name: 'Globex Corp', email: 'billing@globex.example', tier: 'NEW' },
        { id: 3, name: 'Initech', email: 'ap@initech.example' },
      ],
      invoices: [
        { id: 1, clientId: 1, status: 'DRAFT', issueDate: '2026-01-05', dueDate: '2026-04-30',
          approvedTotal: 1500, approvedOn: '2026-01-09',
          lineItems: [{ id: 1, description: 'Build', qty: 1, unitPrice: 1500 }] },
        { id: 2, clientId: 2, status: 'DRAFT', issueDate: '2026-03-01', dueDate: '2026-04-30',
          approvedTotal: 1500, approvedOn: '2026-03-02',
          lineItems: [{ id: 2, description: 'Build', qty: 1, unitPrice: 1500 }] },
        { id: 3, clientId: 2, status: 'DRAFT', issueDate: '2026-03-01', dueDate: '2026-04-30',
          approvedTotal: 1500, approvedOn: '2026-03-03',
          lineItems: [{ id: 3, description: 'Build', qty: 1, unitPrice: 1500 }] },
        { id: 4, clientId: 3, status: 'DRAFT', issueDate: '2026-02-01', dueDate: '2026-04-30',
          approvedTotal: 1500, approvedOn: '2026-02-07',
          lineItems: [{ id: 4, description: 'Build', qty: 1, unitPrice: 1500 }] },
      ],
    });
    await page.goto('/');

    // a key account's approval lasts 90 days: given 60 days ago, still good
    await page.getByTestId('client-row-1').click();
    await page.getByTestId('invoice-row-1').click();
    await expect(page.getByTestId('invoice-approval')).toHaveText('Approved');
    // a new client's lasts 7: 8 days ago has lapsed, 7 days ago has not
    await page.getByTestId('client-row-2').click();
    await page.getByTestId('invoice-row-2').click();
    await expect(page.getByTestId('invoice-panel-number')).toHaveText(await page.getByTestId('invoice-row-2').getByTestId('invoice-number').innerText());
    await expect(page.getByTestId('invoice-approval')).toHaveText('Needs approval');
    await page.getByTestId('invoice-row-3').click();
    await expect(page.getByTestId('invoice-panel-number')).toHaveText(await page.getByTestId('invoice-row-3').getByTestId('invoice-number').innerText());
    await expect(page.getByTestId('invoice-approval')).toHaveText('Approved');
    // everyone else keeps 30 days: 31 days ago has lapsed
    await page.getByTestId('client-row-3').click();
    await page.getByTestId('invoice-row-4').click();
    await expect(page.getByTestId('invoice-panel-number')).toHaveText(await page.getByTestId('invoice-row-4').getByTestId('invoice-number').innerText());
    await expect(page.getByTestId('invoice-approval')).toHaveText('Needs approval');
    await page.getByTestId('invoice-send').click();
    await expect(page.getByTestId('invoice-send-error')).toBeVisible();
  });
});
