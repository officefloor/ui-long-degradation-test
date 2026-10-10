import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// UPDATED (thousands separators): carries the line-item rules forward (the amount is the sum of each
// line's quantity times unit price; adding a line reworks the stored total) and adds commas to a
// line-item invoice's amount. Open an invoice via invoice-open-<id>.
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

    await expect(page.getByTestId('invoice-row-1').getByTestId('invoice-amount')).toHaveText('$200.00');

    await page.getByTestId('invoice-open-1').click();
    await expect(page.getByTestId('invoice-lineitems-table')).toBeVisible();
    await expect(page.getByTestId('lineitem-row-1').getByTestId('lineitem-description')).toHaveText('Design');
    // Each line reports its OWN figures, and its amount is quantity TIMES unit price — a line
    // amount that ignored the quantity would be right whenever the quantity is 1.
    await expect(page.getByTestId('lineitem-row-1').getByTestId('lineitem-qty')).toHaveText('2');
    await expect(page.getByTestId('lineitem-row-1').getByTestId('lineitem-unitprice')).toHaveText('$50.00');
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

    // The project's invoice list reads the stored figure, which must have been reworked too.
    await page.getByTestId('nav-projects').click();
    await page.getByTestId('project-open-1').click();
    await expect(page.getByTestId('invoice-row-1').getByTestId('invoice-amount')).toHaveText('$240.00');
  });

  test('invoice amount is the sum of its line items, with commas', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      projects: [{ id: 1, name: 'Website Rebuild', clientId: 1 }],
      invoices: [
        {
          id: 1, projectId: 1, status: 'DRAFT',
          lineItems: [
            { id: 1, description: 'Design', qty: 2, unitPrice: 500 },
            { id: 2, description: 'Development', qty: 1, unitPrice: 234.5 },
          ],
        },
      ],
    });
    await page.goto('/');
    await page.getByTestId('nav-projects').click();
    await page.getByTestId('project-open-1').click();
    await expect(page.getByTestId('invoice-row-1').getByTestId('invoice-amount')).toHaveText('$1,234.50');
  });
});
