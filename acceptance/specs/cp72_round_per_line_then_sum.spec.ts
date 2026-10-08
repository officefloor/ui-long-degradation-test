import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// MUTATIVE (revises the line-items and sales-tax rules). Each line is worked out and rounded to the
// cent first, then the lines are summed — so the invoice total is the sum of the rounded lines, not
// a rounded sum. Updated copies of the line-items and sales-tax specs ship in the sibling override
// folder. Here two lines of 10.005 each round to 10.01, summing to 20.02 (a rounded sum would be
// 20.01).
test.describe('round each line then sum', () => {
  test('totals the rounded line amounts', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      projects: [{ id: 1, name: 'Website Rebuild', clientId: 1 }],
      invoices: [{
        id: 1, projectId: 1, status: 'DRAFT',
        lineItems: [
          { id: 1, description: 'A', qty: 1, unitPrice: 10.005 },
          { id: 2, description: 'B', qty: 1, unitPrice: 10.005 },
        ],
      }],
    });
    await page.goto('/');
    await page.getByTestId('nav-projects').click();
    await page.getByTestId('project-open-1').click();
    await page.getByTestId('invoice-open-1').click();

    await expect(page.getByTestId('lineitem-row-1').getByTestId('lineitem-amount')).toHaveText('$10.01');
    await expect(page.getByTestId('lineitem-row-2').getByTestId('lineitem-amount')).toHaveText('$10.01');
    await expect(page.getByTestId('invoice-subtotal')).toHaveText('$20.02');
  });
});
