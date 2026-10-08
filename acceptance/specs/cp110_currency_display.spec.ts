import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// Each client's amounts are shown with their currency's symbol and decimal places. Yen has no
// decimals.
test.describe('currency display', () => {
  test('shows the right symbol and decimals', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      currencies: [{ code: 'JPY', symbol: '¥', decimals: 0 }],
      clients: [{ id: 1, name: 'Tokyo KK', email: 'ops@tokyo.example', currency: 'JPY' }],
      projects: [{ id: 1, name: 'Website Rebuild', clientId: 1 }],
      invoices: [{ id: 1, projectId: 1, status: 'SENT', lineItems: [{ id: 1, description: 'Work', qty: 1, unitPrice: 1000 }] }],
    });
    await page.goto('/');
    await page.getByTestId('nav-projects').click();
    await page.getByTestId('project-open-1').click();

    await expect(page.getByTestId('invoice-row-1').getByTestId('invoice-amount')).toHaveText('¥1,000');
  });
});
