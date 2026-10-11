import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// A client can have a tier (clients[].tier: STANDARD by default, KEY or NEW; the client form's tier
// list). The workspace can set an approval limit per tier (settings.tierApprovalLimits, tier -> US
// dollars); a client whose tier has one uses it instead of the workspace approval limit, converted
// to their currency the same way.
test.describe('approval limits by tier', () => {
  test("uses the approval limit of the client's tier", { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-03-10',
      settings: {
        usdPer: { EUR: 1.1, GBP: 1.25, JPY: 0.0066, CHF: 1.13 },
        approvalLimit: 5000,
        tierApprovalLimits: { KEY: 20000, NEW: 1000 },
      },
      clients: [
        { id: 1, name: 'Acme Ltd', email: 'ops@acme.example', tier: 'KEY' },
        { id: 2, name: 'Globex Corp', email: 'billing@globex.example', tier: 'NEW', currency: 'GBP' },
        { id: 3, name: 'Initech', email: 'ap@initech.example' },
      ],
      invoices: [
        { id: 1, clientId: 1, status: 'DRAFT', issueDate: '2026-03-01', dueDate: '2026-04-30',
          lineItems: [{ id: 1, description: 'Build', qty: 1, unitPrice: 8000 }] },
        { id: 2, clientId: 2, status: 'DRAFT', issueDate: '2026-03-01', dueDate: '2026-04-30',
          lineItems: [{ id: 2, description: 'Build', qty: 1, unitPrice: 800 }] },
        { id: 3, clientId: 2, status: 'DRAFT', issueDate: '2026-03-01', dueDate: '2026-04-30',
          lineItems: [{ id: 3, description: 'Build', qty: 1, unitPrice: 801 }] },
        { id: 4, clientId: 3, status: 'DRAFT', issueDate: '2026-03-01', dueDate: '2026-04-30',
          lineItems: [{ id: 4, description: 'Build', qty: 1, unitPrice: 6000 }] },
      ],
    });
    await page.goto('/');

    // a key account may go to 20,000.00 without approval
    await page.getByTestId('client-row-1').click();
    await page.getByTestId('invoice-row-1').click();
    await expect(page.getByTestId('invoice-approval')).toHaveText('Not needed');
    // a new client's limit is 1,000.00 US dollars: 1,000 / 1.25 = £800.00
    await page.getByTestId('client-row-2').click();
    await page.getByTestId('invoice-row-2').click();
    await expect(page.getByTestId('invoice-panel-number')).toHaveText(await page.getByTestId('invoice-row-2').getByTestId('invoice-number').innerText());
    await expect(page.getByTestId('invoice-approval')).toHaveText('Not needed');
    await page.getByTestId('invoice-row-3').click();
    await expect(page.getByTestId('invoice-panel-number')).toHaveText(await page.getByTestId('invoice-row-3').getByTestId('invoice-number').innerText());
    await expect(page.getByTestId('invoice-approval')).toHaveText('Needs approval');
    // a client with no tier keeps the workspace's 5,000.00
    await page.getByTestId('client-row-3').click();
    await page.getByTestId('invoice-row-4').click();
    await expect(page.getByTestId('invoice-panel-number')).toHaveText(await page.getByTestId('invoice-row-4').getByTestId('invoice-number').innerText());
    await expect(page.getByTestId('invoice-approval')).toHaveText('Needs approval');
  });

  test('sets the tier when adding a client', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-03-10',
      settings: {
        usdPer: { EUR: 1.1, GBP: 1.25, JPY: 0.0066, CHF: 1.13 },
        approvalLimit: 5000,
        tierApprovalLimits: { KEY: 20000, NEW: 1000 },
      },
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      invoices: [],
    });
    await page.goto('/');

    await page.getByTestId('client-form-name').fill('Umbrella Co');
    await page.getByTestId('client-form-email').fill('ap@umbrella.example');
    await page.getByTestId('client-form-tier').selectOption('NEW');
    await page.getByTestId('client-form-submit').click();
    await page.getByTestId('client-row-2').click();
    await page.getByTestId('invoice-new').click();
    await page.getByTestId('line-form-description').fill('Build');
    await page.getByTestId('line-form-qty').fill('1');
    await page.getByTestId('line-form-unit-price').fill('1500');
    await page.getByTestId('line-form-submit').click();
    await expect(page.getByTestId('invoice-approval')).toHaveText('Needs approval');
    await page.getByTestId('invoice-send').click();
    await expect(page.getByTestId('invoice-send-error')).toBeVisible();
  });
});
