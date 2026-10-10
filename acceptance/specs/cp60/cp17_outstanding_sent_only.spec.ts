import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// UPDATED for cp60 (mutates 17): outstanding still counts SENT invoices only using the discounted
// amount, now reported under the client's own currency; carries the separate drafts figure forward,
// and still leaves out drafts and invoices that are paid in full, across several invoices.
test.describe('outstanding counts sent invoices only', () => {
  test('the outstanding total excludes drafts', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example', currency: 'USD' }],
      projects: [{ id: 1, name: 'Website Rebuild', clientId: 1 }],
      invoices: [
        { id: 1, projectId: 1, status: 'SENT', lineItems: [{ id: 1, description: 'A', qty: 1, unitPrice: 100 }] },
        { id: 2, projectId: 1, status: 'DRAFT', lineItems: [{ id: 2, description: 'B', qty: 1, unitPrice: 50 }] },
        { id: 3, projectId: 1, status: 'SENT', lineItems: [{ id: 3, description: 'C', qty: 1, unitPrice: 200 }] },
        { id: 4, projectId: 1, status: 'SENT', lineItems: [{ id: 4, description: 'D', qty: 1, unitPrice: 30 }] },
        { id: 5, projectId: 1, status: 'DRAFT', lineItems: [{ id: 5, description: 'E', qty: 1, unitPrice: 25 }] },
      ],
      payments: [{ id: 1, invoiceId: 4, amount: 30, date: '2026-02-01' }],
    });
    await page.goto('/');
    await page.getByTestId('nav-dashboard').click();

    // 100 + 200 sent and unpaid; the drafts and the fully paid 30 are excluded.
    await expect(page.getByTestId('dashboard-outstanding-USD')).toHaveText('$300.00');
    // The two drafts, 50 + 25, waiting to be sent.
    await expect(page.getByTestId('dashboard-drafts-total')).toHaveText('$75.00');
  });

  test('outstanding is discounted, excludes drafts, and is per currency', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example', currency: 'USD' }],
      projects: [{ id: 1, name: 'Website Rebuild', clientId: 1 }],
      invoices: [
        { id: 1, projectId: 1, status: 'SENT', discountPct: 10, lineItems: [{ id: 1, description: 'A', qty: 1, unitPrice: 200 }] },
        { id: 2, projectId: 1, status: 'DRAFT', lineItems: [{ id: 2, description: 'B', qty: 1, unitPrice: 50 }] },
      ],
    });
    await page.goto('/');
    await page.getByTestId('nav-dashboard').click();
    await expect(page.getByTestId('dashboard-outstanding-USD')).toHaveText('$180.00');
    await expect(page.getByTestId('dashboard-drafts-total')).toHaveText('$50.00');
  });
});
