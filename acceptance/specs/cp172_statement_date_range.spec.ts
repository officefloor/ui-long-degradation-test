import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// MUTATIVE (revises the statement rule). A statement can be run for a date range with an opening
// and a closing balance that reconcile. An updated statement spec ships in the sibling override
// folder.
test.describe('statement date range', () => {
  test('opening and closing balances reconcile over a range', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example', currency: 'USD' }],
      projects: [{ id: 1, name: 'Website Rebuild', clientId: 1 }],
      invoices: [
        { id: 1, projectId: 1, status: 'SENT', issueDate: '2026-01-15', lineItems: [{ id: 1, description: 'Prior', qty: 1, unitPrice: 100 }] },
        { id: 2, projectId: 1, status: 'SENT', issueDate: '2026-02-10', lineItems: [{ id: 2, description: 'In range', qty: 1, unitPrice: 300 }] },
      ],
    });
    await page.goto('/');
    await page.getByTestId('nav-clients').click();
    await page.getByTestId('client-open-1').click();
    await page.getByTestId('client-statement-open').click();

    await page.getByTestId('statement-range-from').fill('2026-02-01');
    await page.getByTestId('statement-range-to').fill('2026-02-28');
    await page.getByTestId('statement-range-apply').click();

    await expect(page.getByTestId('statement-opening-balance')).toHaveText('$100.00');
    await expect(page.getByTestId('statement-closing-balance')).toHaveText('$400.00');
  });
});
