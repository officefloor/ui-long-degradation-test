import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// UPDATED statement spec: carries the discounted client-currency total and the running account
// forward, and holds the statement figures to the same rounding as the invoices.
test.describe('client statement', () => {
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

  test('statement total matches the invoices to the cent', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example', currency: 'USD' }],
      projects: [{ id: 1, name: 'Website Rebuild', clientId: 1 }],
      invoices: [
        { id: 1, projectId: 1, status: 'SENT', lineItems: [{ id: 1, description: 'A', qty: 3, unitPrice: 33.33 }] },
        { id: 2, projectId: 1, status: 'SENT', lineItems: [{ id: 2, description: 'B', qty: 1, unitPrice: 0.01 }] },
      ],
    });
    await page.goto('/');
    await page.getByTestId('nav-clients').click();
    await page.getByTestId('client-open-1').click();
    await page.getByTestId('client-statement-open').click();
    await expect(page.getByTestId('client-outstanding-total')).toHaveText('$100.00');
  });
});
