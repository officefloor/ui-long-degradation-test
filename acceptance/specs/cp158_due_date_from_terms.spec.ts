import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// An invoice's due date is worked out from the client's payment terms and the invoice's issue date,
// both for invoices already on file and for a new invoice raised in the app (given an issue date,
// no due date).
test.describe('due date from terms', () => {
  test('derives the due date from net terms', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example', paymentTermsDays: 14 }],
      projects: [{ id: 1, name: 'Website Rebuild', clientId: 1 }],
      invoices: [{ id: 1, projectId: 1, status: 'SENT', issueDate: '2026-01-01', lineItems: [{ id: 1, description: 'Work', qty: 1, unitPrice: 100 }] }],
    });
    await page.goto('/');
    await page.getByTestId('nav-projects').click();
    await page.getByTestId('project-open-1').click();

    await expect(page.getByTestId('invoice-row-1').getByTestId('invoice-due')).toHaveText('2026-01-15');
  });

  test('a new invoice falls due on the client terms', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-01-01',
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example', paymentTermsDays: 14 }],
      projects: [{ id: 1, name: 'Website Rebuild', clientId: 1 }],
      invoices: [],
    });
    await page.goto('/');
    await page.getByTestId('nav-projects').click();
    await page.getByTestId('project-open-1').click();

    await page.getByTestId('invoice-form-amount').fill('100');
    await page.getByTestId('invoice-form-issued').fill('2026-01-01');
    await page.getByTestId('invoice-form-submit').click();

    const row = page.getByTestId(/^invoice-row-/);
    await expect(row).toHaveCount(1);
    await expect(row.first().getByTestId('invoice-issued')).toHaveText('2026-01-01');
    await expect(row.first().getByTestId('invoice-due')).toHaveText('2026-01-15');
  });
});
