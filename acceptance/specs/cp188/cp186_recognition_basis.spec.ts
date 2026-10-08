import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// UPDATED recognition-basis spec: the setting is saved AND it changes the revenue report total.
test.describe('recognition basis', () => {
  test('the chosen basis is saved', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({});
    await page.goto('/');
    await page.getByTestId('nav-settings').click();
    await page.getByTestId('settings-recognition-basis').selectOption('paid');
    await page.getByTestId('settings-save').click();

    await page.reload();
    await page.getByTestId('nav-settings').click();
    await expect(page.getByTestId('settings-recognition-basis')).toHaveValue('paid');
  });

  test('the revenue total reflects the basis', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      settings: { recognitionBasis: 'sent' },
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      projects: [{ id: 1, name: 'Website Rebuild', clientId: 1 }],
      invoices: [
        { id: 1, projectId: 1, status: 'PAID', issueDate: '2026-02-05', lineItems: [{ id: 1, description: 'A', qty: 1, unitPrice: 100 }] },
        { id: 2, projectId: 1, status: 'SENT', issueDate: '2026-02-06', lineItems: [{ id: 2, description: 'B', qty: 1, unitPrice: 200 }] },
      ],
    });
    await page.goto('/');
    await page.getByTestId('nav-dashboard').click();
    await page.getByTestId('revenue-report-open').click();
    await page.getByTestId('revenue-report-from').fill('2026-02-01');
    await page.getByTestId('revenue-report-to').fill('2026-02-28');
    await page.getByTestId('revenue-report-apply').click();
    await expect(page.getByTestId('revenue-report-total')).toHaveText('$300.00');
  });
});
