import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// A sent invoice can be viewed exactly as it was at the time it was sent, even if the rules changed
// afterwards. The invoice was sent showing a total of $240.00 (captured in its snapshot); its live
// figures now compute to $216.00 after a later discount, but the snapshot still reads $240.00.
test.describe('invoice snapshot', () => {
  test('shows the invoice as it was when sent', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      projects: [{ id: 1, name: 'Website Rebuild', clientId: 1 }],
      invoices: [{
        id: 1, projectId: 1, status: 'SENT', discountPct: 10, taxPct: 20,
        sentSnapshot: { total: 240, date: '2026-01-15' },
        lineItems: [{ id: 1, description: 'Work', qty: 1, unitPrice: 200 }],
      }],
    });
    await page.goto('/');
    await page.getByTestId('nav-projects').click();
    await page.getByTestId('project-open-1').click();
    await page.getByTestId('invoice-open-1').click();

    await expect(page.getByTestId('invoice-amount')).toHaveText('$216.00');

    await page.getByTestId('invoice-snapshot-view').click();
    await expect(page.getByTestId('invoice-snapshot-total')).toHaveText('$240.00');
    await expect(page.getByTestId('invoice-snapshot-date')).toHaveText('2026-01-15');
  });
});
