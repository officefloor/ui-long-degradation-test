import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// A MEDIUM-risk client's approval limit is half of the one that would otherwise apply (the
// workspace's or their tier's), in US dollars before it is converted to their currency.
test.describe('half the limit for medium risk', () => {
  test('a medium-risk client has half the approval limit', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-04-30',
      settings: { approvalLimit: 1000, usdPer: { EUR: 1.1, GBP: 1.25, JPY: 0.0066, CHF: 1.13 } },
      clients: [
        { id: 1, name: 'Acme Ltd', email: 'ops@acme.example' },
        { id: 2, name: 'Globex Corp', email: 'billing@globex.example', currency: 'EUR' },
        { id: 3, name: 'Initech', email: 'ap@initech.example' },
      ],
      invoices: [
        { id: 1, clientId: 1, status: 'SENT', issueDate: '2026-01-01', dueDate: '2026-01-31',
          lineItems: [{ id: 1, description: 'Design', qty: 1, unitPrice: 100 }] },
        { id: 2, clientId: 2, status: 'SENT', issueDate: '2026-01-01', dueDate: '2026-01-31',
          lineItems: [{ id: 2, description: 'Design', qty: 1, unitPrice: 100 }] },
        { id: 3, clientId: 1, status: 'DRAFT', issueDate: '2026-04-20', dueDate: '2026-05-31',
          lineItems: [{ id: 3, description: 'Build', qty: 1, unitPrice: 600 }] },
        { id: 4, clientId: 2, status: 'DRAFT', issueDate: '2026-04-20', dueDate: '2026-05-31',
          lineItems: [{ id: 4, description: 'Build', qty: 1, unitPrice: 455 }] },
        { id: 5, clientId: 3, status: 'DRAFT', issueDate: '2026-04-20', dueDate: '2026-05-31',
          lineItems: [{ id: 5, description: 'Build', qty: 1, unitPrice: 600 }] },
      ],
      payments: [
        { id: 1, clientId: 1, amount: 100, date: '2026-02-10', allocations: [{ invoiceId: 1, amount: 100 }] },
        { id: 2, clientId: 2, amount: 100, date: '2026-02-10', allocations: [{ invoiceId: 2, amount: 100 }] },
      ],
    });
    await page.goto('/');

    // paid 10 days late: MEDIUM, so 500.00 instead of 1,000.00
    await expect(page.getByTestId('client-row-1').getByTestId('client-risk-band')).toHaveText('MEDIUM');
    await page.getByTestId('client-row-1').click();
    await page.getByTestId('invoice-row-3').click();
    await expect(page.getByTestId('invoice-approval')).toHaveText('Needs approval');
    // in euros: 500 / 1.10 = 454.5454, down to €454.54, and €455.00 is over it
    await page.getByTestId('client-row-2').click();
    await page.getByTestId('invoice-row-4').click();
    await expect(page.getByTestId('invoice-approval')).toHaveText('Needs approval');
    // a LOW client keeps the whole limit
    await page.getByTestId('client-row-3').click();
    await page.getByTestId('invoice-row-5').click();
    await expect(page.getByTestId('invoice-approval')).toHaveText('Not needed');
  });
});
