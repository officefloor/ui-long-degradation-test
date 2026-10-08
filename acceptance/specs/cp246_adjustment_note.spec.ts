import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// A sent invoice is corrected by issuing an adjustment note against it, rather than editing it. The
// original invoice amount stays $200.00; a -$50.00 adjustment note leaves an adjusted total of
// $150.00, and the adjustment is listed.
test.describe('adjustment note', () => {
  test('corrects a sent invoice without changing the original', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      projects: [{ id: 1, name: 'Website Rebuild', clientId: 1 }],
      invoices: [{ id: 1, projectId: 1, status: 'SENT', lineItems: [{ id: 1, description: 'Work', qty: 1, unitPrice: 200 }] }],
    });
    await page.goto('/');
    await page.getByTestId('nav-projects').click();
    await page.getByTestId('project-open-1').click();
    await page.getByTestId('invoice-open-1').click();

    await page.getByTestId('adjustment-note-form-amount').fill('-50');
    await page.getByTestId('adjustment-note-form-reason').fill('Overcharged for one item');
    await page.getByTestId('adjustment-note-submit').click();

    await expect(page.getByTestId('invoice-amount')).toHaveText('$200.00');
    await expect(page.getByTestId('adjustment-note-row-1').getByTestId('adjustment-note-amount')).toHaveText('-$50.00');
    await expect(page.getByTestId('invoice-adjusted-total')).toHaveText('$150.00');
  });
});
