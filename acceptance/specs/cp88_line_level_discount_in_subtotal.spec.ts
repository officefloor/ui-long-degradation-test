import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// A charge line's own discount may be a percentage or a flat amount. Either way it is already taken
// off before the invoice subtotal, so the invoice discount and tax work on the netted subtotal.
test.describe('line discount nets into the subtotal', () => {
  test('subtotal already reflects line discounts', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      projects: [{ id: 1, name: 'Website Rebuild', clientId: 1 }],
      invoices: [{
        id: 1, projectId: 1, status: 'DRAFT',
        lineItems: [{ id: 1, description: 'Work', qty: 1, unitPrice: 200, discountPct: 10 }],
      }],
    });
    await page.goto('/');
    await page.getByTestId('nav-projects').click();
    await page.getByTestId('project-open-1').click();
    await page.getByTestId('invoice-open-1').click();

    // 200 less a 10% line discount = 180, which is the subtotal.
    await expect(page.getByTestId('lineitem-row-1').getByTestId('lineitem-amount')).toHaveText('$180.00');
    await expect(page.getByTestId('invoice-subtotal')).toHaveText('$180.00');
  });

  test('takes a flat amount off a single line', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      projects: [{ id: 1, name: 'Website Rebuild', clientId: 1 }],
      invoices: [{
        id: 1, projectId: 1, status: 'DRAFT',
        lineItems: [
          { id: 1, description: 'Work', qty: 1, unitPrice: 200, discountAmount: 30 },
          { id: 2, description: 'Support', qty: 1, unitPrice: 50 },
        ],
      }],
    });
    await page.goto('/');
    await page.getByTestId('nav-projects').click();
    await page.getByTestId('project-open-1').click();
    await page.getByTestId('invoice-open-1').click();

    // 200 less a flat 30 = 170 on line 1; line 2 is untouched; subtotal 170 + 50 = 220.
    await expect(page.getByTestId('lineitem-row-1').getByTestId('lineitem-amount')).toHaveText('$170.00');
    await expect(page.getByTestId('lineitem-row-2').getByTestId('lineitem-amount')).toHaveText('$50.00');
    await expect(page.getByTestId('invoice-subtotal')).toHaveText('$220.00');
    await expect(page.getByTestId('invoice-amount')).toHaveText('$220.00');
  });

  test('the invoice discount and tax work on the netted subtotal', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      projects: [{ id: 1, name: 'Website Rebuild', clientId: 1 }],
      invoices: [{
        id: 1, projectId: 1, status: 'DRAFT', discountPct: 10, taxPct: 20,
        lineItems: [{ id: 1, description: 'Work', qty: 1, unitPrice: 200, discountPct: 10 }],
      }],
    });
    await page.goto('/');
    await page.getByTestId('nav-projects').click();
    await page.getByTestId('project-open-1').click();
    await page.getByTestId('invoice-open-1').click();

    // Line: 200 less 10% = 180 (the subtotal). Invoice discount 10% of 180 = 18, leaving a taxable
    // base of 162. Tax 20% of 162 = 32.40. Total 162 + 32.40 = 194.40.
    await expect(page.getByTestId('invoice-subtotal')).toHaveText('$180.00');
    await expect(page.getByTestId('invoice-discount')).toHaveText('$18.00');
    await expect(page.getByTestId('invoice-taxable-base')).toHaveText('$162.00');
    await expect(page.getByTestId('invoice-tax')).toHaveText('$32.40');
    await expect(page.getByTestId('invoice-amount')).toHaveText('$194.40');
  });
});
