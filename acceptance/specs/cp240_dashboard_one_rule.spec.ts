import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// Every figure on the home screen uses the base currency and the same exclusions — outstanding and
// billings agree, in the base currency, leaving out disputed and written-off.
test.describe('dashboard one rule', () => {
  test('all figures share the base currency and exclusions', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-02-28',
      settings: { baseCurrency: 'EUR' },
      fxRates: [{ currency: 'EUR', date: '2026-02-01', rate: 1.10 }],
      clients: [{ id: 1, name: 'Dollar Co', email: 'a@ex.example', currency: 'USD' }],
      projects: [{ id: 1, name: 'A', clientId: 1 }],
      invoices: [
        { id: 1, projectId: 1, status: 'SENT', issueDate: '2026-02-01', lineItems: [{ id: 1, description: 'x', qty: 1, unitPrice: 110 }] },
        { id: 2, projectId: 1, status: 'SENT', issueDate: '2026-02-02', disputed: true, lineItems: [{ id: 2, description: 'y', qty: 1, unitPrice: 220 }] },
      ],
    });
    await page.goto('/');
    await page.getByTestId('nav-dashboard').click();
    await expect(page.getByTestId('kpi-outstanding')).toHaveText('€100.00');
    await expect(page.getByTestId('kpi-billings-month')).toHaveText('€100.00');
  });
});
