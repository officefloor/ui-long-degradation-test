import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// UPDATED sales-tax spec (carries the original intent forward). Tax is added after any discount,
// and is charged on the TAXABLE base only: tax-free lines are excluded. This replaces the original
// sales-tax spec in the cumulative suite (installed by basename).
test.describe('sales tax', () => {
  test('adds tax after the discount (all lines taxable)', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      projects: [{ id: 1, name: 'Website Rebuild', clientId: 1 }],
      invoices: [{ id: 1, projectId: 1, status: 'DRAFT', discountPct: 10, taxPct: 20, lineItems: [{ id: 1, description: 'Work', qty: 1, unitPrice: 200 }] }],
    });
    await page.goto('/');
    await page.getByTestId('nav-projects').click();
    await page.getByTestId('project-open-1').click();
    await page.getByTestId('invoice-open-1').click();

    await expect(page.getByTestId('invoice-subtotal')).toHaveText('$200.00');
    await expect(page.getByTestId('invoice-discount')).toHaveText('$20.00');
    await expect(page.getByTestId('invoice-taxable-base')).toHaveText('$180.00');
    await expect(page.getByTestId('invoice-tax')).toHaveText('$36.00');
    await expect(page.getByTestId('invoice-amount')).toHaveText('$216.00');
  });

  test('excludes tax-free lines from the tax base', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      projects: [{ id: 1, name: 'Website Rebuild', clientId: 1 }],
      invoices: [{
        id: 1, projectId: 1, status: 'DRAFT', taxPct: 20,
        lineItems: [
          { id: 1, description: 'Design', qty: 1, unitPrice: 200 },
          { id: 2, description: 'Government fee', qty: 1, unitPrice: 100, taxExempt: true },
        ],
      }],
    });
    await page.goto('/');
    await page.getByTestId('nav-projects').click();
    await page.getByTestId('project-open-1').click();
    await page.getByTestId('invoice-open-1').click();

    await expect(page.getByTestId('invoice-subtotal')).toHaveText('$300.00');
    await expect(page.getByTestId('invoice-taxable-base')).toHaveText('$200.00');
    await expect(page.getByTestId('invoice-tax')).toHaveText('$40.00');
    await expect(page.getByTestId('invoice-amount')).toHaveText('$340.00');
  });
});
