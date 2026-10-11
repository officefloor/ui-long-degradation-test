import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// UPDATED invoice-amount validation now that an invoice is built from line items rather than one
// typed figure: the same limits carry forward. A line for nothing (no quantity or no price) is not
// added, and a line that would take the invoice over $100,000 is not added; a total of exactly
// $100,000 is fine.
test.describe('invoice amount validation', () => {
  test('refuses a line with no quantity or no price', { tag: '@error' }, async ({ page }) => {
    await resetAndSeed({
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      projects: [{ id: 1, name: 'Website Rebuild', clientId: 1 }],
      invoices: [{ id: 1, projectId: 1, status: 'DRAFT', lineItems: [] }],
    });
    await page.goto('/');
    await page.getByTestId('nav-projects').click();
    await page.getByTestId('project-open-1').click();
    await page.getByTestId('invoice-open-1').click();

    await page.getByTestId('lineitem-form-description').fill('Nothing');
    await page.getByTestId('lineitem-form-qty').fill('0');
    await page.getByTestId('lineitem-form-unitprice').fill('80');
    await page.getByTestId('lineitem-form-submit').click();
    await page.getByTestId('lineitem-form-qty').fill('2');
    await page.getByTestId('lineitem-form-unitprice').fill('0');
    await page.getByTestId('lineitem-form-submit').click();

    await expect(page.getByTestId(/^lineitem-row-/)).toHaveCount(0);
  });

  test('refuses a line that takes the invoice over $100,000', { tag: '@error' }, async ({ page }) => {
    await resetAndSeed({
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      projects: [{ id: 1, name: 'Website Rebuild', clientId: 1 }],
      invoices: [{ id: 1, projectId: 1, status: 'DRAFT', lineItems: [{ id: 1, description: 'Build', qty: 1, unitPrice: 90000 }] }],
    });
    await page.goto('/');
    await page.getByTestId('nav-projects').click();
    await page.getByTestId('project-open-1').click();
    await page.getByTestId('invoice-open-1').click();

    await page.getByTestId('lineitem-form-description').fill('Extra');
    await page.getByTestId('lineitem-form-qty').fill('1');
    await page.getByTestId('lineitem-form-unitprice').fill('20000');
    await page.getByTestId('lineitem-form-submit').click();
    await expect(page.getByTestId(/^lineitem-row-/)).toHaveCount(1);
    await expect(page.getByTestId('invoice-amount')).toHaveText('$90,000.00');

    await page.getByTestId('lineitem-form-unitprice').fill('10000');
    await page.getByTestId('lineitem-form-submit').click();
    await expect(page.getByTestId(/^lineitem-row-/)).toHaveCount(2);
    await expect(page.getByTestId('invoice-amount')).toHaveText('$100,000.00');
  });
});
