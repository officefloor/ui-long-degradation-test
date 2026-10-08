import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// Part of an invoice can be written off as bad debt. The written-off part stops counting as owed;
// the rest still does.
test.describe('partial write-off', () => {
  test('writes off part of an invoice', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      projects: [{ id: 1, name: 'Website Rebuild', clientId: 1 }],
      invoices: [{ id: 1, projectId: 1, status: 'SENT', writeOff: 40, lineItems: [{ id: 1, description: 'Work', qty: 1, unitPrice: 100 }] }],
    });
    await page.goto('/');
    await page.getByTestId('nav-projects').click();
    await page.getByTestId('project-open-1').click();
    await page.getByTestId('invoice-open-1').click();

    await expect(page.getByTestId('invoice-write-off-amount')).toHaveText('$40.00');
    await expect(page.getByTestId('invoice-due-amount')).toHaveText('$60.00');
  });
});
