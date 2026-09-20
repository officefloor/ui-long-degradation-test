import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// Each charge line shows its quantity and unit, and the amount for that line (quantity times price).
test.describe('line item quantity and unit', () => {
  test('shows quantity, unit and per-line amount', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      projects: [{ id: 1, name: 'Website Rebuild', clientId: 1 }],
      invoices: [{
        id: 1, projectId: 1, status: 'DRAFT',
        lineItems: [{ id: 1, description: 'Consulting', qty: 2, unit: 'hours', unitPrice: 50 }],
      }],
    });
    await page.goto('/');
    await page.getByTestId('nav-jobs').click();
    await page.getByTestId('job-open-1').click();
    await page.getByTestId('invoice-open-1').click();

    const row = page.getByTestId('lineitem-row-1');
    await expect(row.getByTestId('lineitem-qty')).toHaveText('2');
    await expect(row.getByTestId('lineitem-unit')).toHaveText('hours');
    await expect(row.getByTestId('lineitem-amount')).toHaveText('$100.00');
  });
});
