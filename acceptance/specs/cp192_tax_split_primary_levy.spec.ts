import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// The tax summary splits into the main tax and the levy, each totalled for the period.
test.describe('tax summary split', () => {
  test('totals the main tax and the levy separately', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      projects: [{ id: 1, name: 'Website Rebuild', clientId: 1 }],
      invoices: [
        { id: 1, projectId: 1, status: 'SENT', issueDate: '2026-02-05', taxPct: 20, levyPct: 5, lineItems: [{ id: 1, description: 'A', qty: 1, unitPrice: 100 }] },
        { id: 2, projectId: 1, status: 'SENT', issueDate: '2026-02-20', taxPct: 20, levyPct: 5, lineItems: [{ id: 2, description: 'B', qty: 1, unitPrice: 200 }] },
      ],
    });
    await page.goto('/');
    await page.getByTestId('nav-dashboard').click();
    await page.getByTestId('tax-summary-open').click();
    await page.getByTestId('tax-summary-from').fill('2026-02-01');
    await page.getByTestId('tax-summary-to').fill('2026-02-28');
    await page.getByTestId('tax-summary-apply').click();

    await expect(page.getByTestId('tax-summary-primary')).toHaveText('$60.00');
    await expect(page.getByTestId('tax-summary-levy')).toHaveText('$15.00');
  });
});
