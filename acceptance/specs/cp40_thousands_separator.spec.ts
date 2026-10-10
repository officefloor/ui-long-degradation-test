import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// Bigger money amounts are shown with thousands separators, like $1,234.50, and a price can be typed
// the same way: "1,234.50" in a charge line's unit price means one thousand two hundred and
// thirty-four dollars fifty.
test.describe('thousands separators', () => {
  test('shows commas in large amounts', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      projects: [{ id: 1, name: 'Website Rebuild', clientId: 1 }],
      invoices: [{ id: 1, projectId: 1, status: 'SENT', lineItems: [{ id: 1, description: 'Build', qty: 1, unitPrice: 1234.5 }] }],
    });
    await page.goto('/');
    await page.getByTestId('nav-projects').click();
    await page.getByTestId('project-open-1').click();
    await expect(page.getByTestId('invoice-row-1').getByTestId('invoice-amount')).toHaveText('$1,234.50');
  });

  test('accepts a price typed with commas', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      projects: [{ id: 1, name: 'Website Rebuild', clientId: 1 }],
      invoices: [{ id: 1, projectId: 1, status: 'DRAFT', lineItems: [] }],
    });
    await page.goto('/');
    await page.getByTestId('nav-projects').click();
    await page.getByTestId('project-open-1').click();
    await page.getByTestId('invoice-open-1').click();

    await page.getByTestId('lineitem-form-description').fill('Build');
    await page.getByTestId('lineitem-form-qty').fill('1');
    await page.getByTestId('lineitem-form-unitprice').fill('1,234.50');
    await page.getByTestId('lineitem-form-submit').click();

    await expect(page.getByTestId(/^lineitem-row-/)).toHaveCount(1);
    await expect(page.getByTestId(/^lineitem-row-/).first().getByTestId('lineitem-unitprice')).toHaveText('$1,234.50');
    await expect(page.getByTestId('invoice-amount')).toHaveText('$1,234.50');

    await page.getByTestId('nav-projects').click();
    await page.getByTestId('project-open-1').click();
    await expect(page.getByTestId('invoice-row-1').getByTestId('invoice-amount')).toHaveText('$1,234.50');
  });
});
