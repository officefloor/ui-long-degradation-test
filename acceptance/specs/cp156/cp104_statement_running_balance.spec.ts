import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// UPDATED statement-running-balance spec (carries the running account forward, adds the client's
// own currency with a converted home-currency total at the foot).
test.describe('statement running balance', () => {
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

  test('shows the statement in the client currency with a converted home total', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      fxRates: [{ currency: 'EUR', date: '2026-02-01', rate: 1.10 }],
      clients: [{ id: 1, name: 'Globex', email: 'ac@globex.example', currency: 'EUR' }],
      projects: [{ id: 1, name: 'Intranet', clientId: 1 }],
      invoices: [{ id: 1, projectId: 1, status: 'SENT', issueDate: '2026-02-01', lineItems: [{ id: 1, description: 'Work', qty: 1, unitPrice: 200 }] }],
    });
    await page.goto('/');
    await page.getByTestId('nav-clients').click();
    await page.getByTestId('client-open-1').click();
    await page.getByTestId('client-statement-open').click();

    await expect(page.getByTestId('client-outstanding-total')).toHaveText('€200.00');
    await expect(page.getByTestId('statement-home-total')).toHaveText('$220.00');
  });
});
