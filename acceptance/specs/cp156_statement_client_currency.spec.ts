import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// MUTATIVE (revises the statement rule). The statement shows amounts in the client's own currency
// with a converted home-currency total at the foot. An updated statement spec ships in the sibling
// override folder.
test.describe('statement in client currency', () => {
  test('shows the client currency and a converted home total', { tag: '@core' }, async ({ page }) => {
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
