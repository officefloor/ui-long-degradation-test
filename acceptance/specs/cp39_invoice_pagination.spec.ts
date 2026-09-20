import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// The all-invoices list is shown a page at a time (10 per page) with next and previous controls.
test.describe('invoice pagination', () => {
  test('pages through the invoice list ten at a time', { tag: '@functionality' }, async ({ page }) => {
    const invoices = Array.from({ length: 15 }, (_, i) => ({
      id: i + 1, projectId: 1, amount: 10, status: 'SENT',
    }));
    await resetAndSeed({
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      projects: [{ id: 1, name: 'Website Rebuild', clientId: 1 }],
      invoices,
    });
    await page.goto('/');
    await page.getByTestId('nav-invoices').click();

    await expect(page.getByTestId(/^invoice-row-/)).toHaveCount(10);
    await expect(page.getByTestId('invoice-page-label')).toHaveText('1');
    await page.getByTestId('invoice-page-next').click();
    await expect(page.getByTestId(/^invoice-row-/)).toHaveCount(5);
    await expect(page.getByTestId('invoice-page-label')).toHaveText('2');
    await page.getByTestId('invoice-page-prev').click();
    await expect(page.getByTestId(/^invoice-row-/)).toHaveCount(10);
  });
});
