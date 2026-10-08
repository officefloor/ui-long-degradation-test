import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// UPDATED line-items spec (carries the per-line rounding forward, adds line-level discounts): a
// line's own discount is taken off before it enters the subtotal.
test.describe('invoice line items', () => {
  test('invoice amount is the sum of its line items', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      projects: [{ id: 1, name: 'Website Rebuild', clientId: 1 }],
      invoices: [
        {
          id: 1, projectId: 1, status: 'DRAFT',
          lineItems: [
            { id: 1, description: 'Design', qty: 2, unitPrice: 50 },
            { id: 2, description: 'Development', qty: 1, unitPrice: 100 },
          ],
        },
      ],
    });
    await page.goto('/');
    await page.getByTestId('nav-projects').click();
    await page.getByTestId('project-open-1').click();
    await page.getByTestId('invoice-open-1').click();

    await expect(page.getByTestId('lineitem-row-1').getByTestId('lineitem-amount')).toHaveText('$100.00');
    await expect(page.getByTestId('invoice-amount')).toHaveText('$200.00');
  });

  test('adding a line item increases the invoice total', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      projects: [{ id: 1, name: 'Website Rebuild', clientId: 1 }],
      invoices: [{ id: 1, projectId: 1, status: 'DRAFT', lineItems: [] }],
    });
    await page.goto('/');
    await page.getByTestId('nav-projects').click();
    await page.getByTestId('project-open-1').click();
    await page.getByTestId('invoice-open-1').click();

    await page.getByTestId('lineitem-form-description').fill('Consulting');
    await page.getByTestId('lineitem-form-qty').fill('3');
    await page.getByTestId('lineitem-form-unitprice').fill('80');
    await page.getByTestId('lineitem-form-submit').click();

    await expect(page.getByTestId(/^lineitem-row-/)).toHaveCount(1);
    await expect(page.getByTestId('invoice-amount')).toHaveText('$240.00');
  });

  test('a line discount nets into the subtotal', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      projects: [{ id: 1, name: 'Website Rebuild', clientId: 1 }],
      invoices: [{ id: 1, projectId: 1, status: 'DRAFT', lineItems: [{ id: 1, description: 'Work', qty: 1, unitPrice: 200, discountPct: 10 }] }],
    });
    await page.goto('/');
    await page.getByTestId('nav-projects').click();
    await page.getByTestId('project-open-1').click();
    await page.getByTestId('invoice-open-1').click();

    await expect(page.getByTestId('lineitem-row-1').getByTestId('lineitem-amount')).toHaveText('$180.00');
    await expect(page.getByTestId('invoice-subtotal')).toHaveText('$180.00');
  });
});
