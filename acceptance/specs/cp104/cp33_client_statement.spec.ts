import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// UPDATED statement spec (carries the client's own invoices and total owed, and the discounted
// client-currency total forward, adds the running account): the statement lists entries in date
// order with a running balance, and the total owed is unchanged.
test.describe('client statement', () => {
  test('shows the client\'s invoices and the total owed', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      clients: [
        { id: 1, name: 'Acme Ltd', email: 'ops@acme.example' },
        // Another client with an invoice of their own: "all THEIR invoices" cannot be told apart
        // from "all invoices" while only one client has any.
        { id: 2, name: 'Globex', email: 'ac@globex.example' },
      ],
      projects: [
        { id: 1, name: 'Website Rebuild', clientId: 1 },
        { id: 2, name: 'Globex Portal', clientId: 2 },
      ],
      invoices: [
        { id: 1, projectId: 1, status: 'SENT', lineItems: [{ id: 1, description: 'A', qty: 1, unitPrice: 100 }] },
        { id: 2, projectId: 1, status: 'SENT', lineItems: [{ id: 2, description: 'B', qty: 1, unitPrice: 200 }] },
        { id: 3, projectId: 2, status: 'SENT', lineItems: [{ id: 3, description: 'C', qty: 1, unitPrice: 999 }] },
      ],
      payments: [{ id: 1, invoiceId: 2, amount: 50, date: '2026-02-01' }],
    });
    await page.goto('/');
    await page.getByTestId('nav-clients').click();
    await page.getByTestId('client-open-1').click();
    await page.getByTestId('client-statement-open').click();

    await expect(page.getByTestId('client-statement-table')).toBeVisible();
    await expect(page.getByTestId(/^statement-invoice-row-/)).toHaveCount(2);
    await expect(page.getByTestId('statement-invoice-row-3')).toHaveCount(0);
    // due: invoice 1 = 100, invoice 2 = 200 - 50 = 150 -> total 250
    await expect(page.getByTestId('client-outstanding-total')).toHaveText('$250.00');
  });

  test('the total owed uses discounted amounts in the client currency', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example', currency: 'EUR' }],
      projects: [{ id: 1, name: 'Website Rebuild', clientId: 1 }],
      invoices: [
        { id: 1, projectId: 1, status: 'SENT', discountPct: 10, lineItems: [{ id: 1, description: 'A', qty: 1, unitPrice: 1000 }] },
        { id: 2, projectId: 1, status: 'SENT', lineItems: [{ id: 2, description: 'B', qty: 1, unitPrice: 234.5 }] },
      ],
    });
    await page.goto('/');
    await page.getByTestId('nav-clients').click();
    await page.getByTestId('client-open-1').click();
    await page.getByTestId('client-statement-open').click();
    await expect(page.getByTestId('client-outstanding-total')).toHaveText('€1,134.50');
  });

  test('lists entries in date order with a running balance', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      projects: [{ id: 1, name: 'Website Rebuild', clientId: 1 }],
      invoices: [{ id: 1, projectId: 1, status: 'SENT', issueDate: '2026-02-01', lineItems: [{ id: 1, description: 'Work', qty: 1, unitPrice: 300 }] }],
      payments: [{ id: 1, invoiceId: 1, amount: 100, date: '2026-02-10' }],
    });
    await page.goto('/');
    await page.getByTestId('nav-clients').click();
    await page.getByTestId('client-open-1').click();
    await page.getByTestId('client-statement-open').click();

    await expect(page.getByTestId('statement-entry-row-1').getByTestId('statement-running-balance')).toHaveText('$300.00');
    await expect(page.getByTestId('statement-entry-row-2').getByTestId('statement-running-balance')).toHaveText('$200.00');
    await expect(page.getByTestId('client-outstanding-total')).toHaveText('$200.00');
  });
});
