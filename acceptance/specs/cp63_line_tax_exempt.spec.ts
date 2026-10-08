import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// A charge line can be marked tax-free. This checkpoint adds the FLAG and its marker; the tax
// CALCULATION that excludes exempt lines is a later checkpoint. A seeded exempt line shows a
// marker, and a new line can be added with the exempt box ticked. Anchors: lineitem-taxexempt
// (marker), lineitem-form-taxexempt (checkbox on the add-line form).
test.describe('tax-free line items', () => {
  test('shows the tax-free marker and lets a line be marked exempt', { tag: '@functionality' }, async ({ page }) => {
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

    await expect(page.getByTestId('lineitem-row-2').getByTestId('lineitem-taxexempt')).toBeVisible();
    await expect(page.getByTestId('lineitem-row-1').getByTestId('lineitem-taxexempt')).toHaveCount(0);

    await page.getByTestId('lineitem-form-description').fill('Stamp duty');
    await page.getByTestId('lineitem-form-qty').fill('1');
    await page.getByTestId('lineitem-form-unitprice').fill('50');
    await page.getByTestId('lineitem-form-taxexempt').check();
    await page.getByTestId('lineitem-form-submit').click();

    await expect(page.getByTestId(/^lineitem-row-/)).toHaveCount(3);
    await expect(page.getByTestId('lineitem-row-3').getByTestId('lineitem-taxexempt')).toBeVisible();
  });
});
