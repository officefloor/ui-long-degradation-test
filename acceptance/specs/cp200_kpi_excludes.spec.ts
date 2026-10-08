import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// The outstanding figure on the home screen is in the home currency and leaves out disputed and
// written-off invoices.
test.describe('kpi outstanding exclusions', () => {
  test('excludes disputed and written-off invoices', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example', currency: 'USD' }],
      projects: [{ id: 1, name: 'A', clientId: 1 }],
      invoices: [
        { id: 1, projectId: 1, status: 'SENT', lineItems: [{ id: 1, description: 'x', qty: 1, unitPrice: 100 }] },
        { id: 2, projectId: 1, status: 'SENT', disputed: true, lineItems: [{ id: 2, description: 'y', qty: 1, unitPrice: 200 }] },
        { id: 3, projectId: 1, status: 'WRITTEN_OFF', lineItems: [{ id: 3, description: 'z', qty: 1, unitPrice: 50 }] },
      ],
    });
    await page.goto('/');
    await page.getByTestId('nav-dashboard').click();
    await expect(page.getByTestId('kpi-outstanding')).toHaveText('$100.00');
  });
});
