import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// UPDATED (discount flows through): outstanding still counts SENT invoices only, now using the
// discounted amount.
test.describe('outstanding counts sent invoices only', () => {
  test('outstanding is discounted and excludes drafts', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      projects: [{ id: 1, name: 'Website Rebuild', clientId: 1 }],
      invoices: [
        { id: 1, projectId: 1, status: 'SENT', discountPct: 10, lineItems: [{ id: 1, description: 'A', qty: 1, unitPrice: 200 }] },
        { id: 2, projectId: 1, status: 'DRAFT', lineItems: [{ id: 2, description: 'B', qty: 1, unitPrice: 50 }] },
      ],
    });
    await page.goto('/');
    await page.getByTestId('nav-dashboard').click();
    await expect(page.getByTestId('dashboard-outstanding-total')).toHaveText('$180.00');
  });
});
