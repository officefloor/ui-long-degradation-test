import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// A percentage of an invoice can be held back as retention that is not yet due. The invoice shows
// the held amount.
test.describe('retention', () => {
  test('shows the retained amount', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      projects: [{ id: 1, name: 'Website Rebuild', clientId: 1 }],
      invoices: [{ id: 1, projectId: 1, status: 'SENT', retentionPct: 10, lineItems: [{ id: 1, description: 'Work', qty: 1, unitPrice: 1000 }] }],
    });
    await page.goto('/');
    await page.getByTestId('nav-projects').click();
    await page.getByTestId('project-open-1').click();
    await page.getByTestId('invoice-open-1').click();

    await expect(page.getByTestId('invoice-amount')).toHaveText('$1,000.00');
    await expect(page.getByTestId('invoice-retention')).toHaveText('$100.00');
  });
});
