import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// The home screen shows total outstanding across all currencies, converted to the home currency.
test.describe('kpi outstanding', () => {
  test('sums outstanding converted to home currency', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      fxRates: [{ currency: 'EUR', date: '2026-02-01', rate: 1.10 }],
      clients: [
        { id: 1, name: 'Dollar Co', email: 'a@ex.example', currency: 'USD' },
        { id: 2, name: 'Euro Co', email: 'b@ex.example', currency: 'EUR' },
      ],
      projects: [
        { id: 1, name: 'A', clientId: 1 },
        { id: 2, name: 'B', clientId: 2 },
      ],
      invoices: [
        { id: 1, projectId: 1, status: 'SENT', issueDate: '2026-02-01', lineItems: [{ id: 1, description: 'x', qty: 1, unitPrice: 100 }] },
        { id: 2, projectId: 2, status: 'SENT', issueDate: '2026-02-01', lineItems: [{ id: 2, description: 'y', qty: 1, unitPrice: 200 }] },
      ],
    });
    await page.goto('/');
    await page.getByTestId('nav-dashboard').click();
    await expect(page.getByTestId('kpi-outstanding')).toHaveText('$320.00');
  });
});
