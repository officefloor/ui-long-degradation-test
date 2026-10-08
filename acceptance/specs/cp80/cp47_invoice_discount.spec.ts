import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// UPDATED discount spec: an invoice discount may be a percentage or a flat amount. Both come off
// before tax and are shown clearly.
test.describe('invoice discount', () => {
  test('a percentage discount', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      projects: [{ id: 1, name: 'Website Rebuild', clientId: 1 }],
      invoices: [{ id: 1, projectId: 1, status: 'DRAFT', discountPct: 10, lineItems: [{ id: 1, description: 'Work', qty: 1, unitPrice: 200 }] }],
    });
    await page.goto('/');
    await page.getByTestId('nav-projects').click();
    await page.getByTestId('project-open-1').click();
    await page.getByTestId('invoice-open-1').click();

    await expect(page.getByTestId('invoice-subtotal')).toHaveText('$200.00');
    await expect(page.getByTestId('invoice-discount')).toHaveText('$20.00');
    await expect(page.getByTestId('invoice-amount')).toHaveText('$180.00');
  });

  test('a fixed-amount discount', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      projects: [{ id: 1, name: 'Website Rebuild', clientId: 1 }],
      invoices: [{ id: 1, projectId: 1, status: 'DRAFT', discountAmount: 30, lineItems: [{ id: 1, description: 'Work', qty: 1, unitPrice: 200 }] }],
    });
    await page.goto('/');
    await page.getByTestId('nav-projects').click();
    await page.getByTestId('project-open-1').click();
    await page.getByTestId('invoice-open-1').click();

    await expect(page.getByTestId('invoice-discount')).toHaveText('$30.00');
    await expect(page.getByTestId('invoice-amount')).toHaveText('$170.00');
  });
});
