import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// An invoice's due date is worked out from the client's payment terms and the invoice's issue date.
test.describe('due date from terms', () => {
  test('derives the due date from net terms', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example', paymentTermsDays: 30 }],
      projects: [{ id: 1, name: 'Website Rebuild', clientId: 1 }],
      invoices: [{ id: 1, projectId: 1, status: 'SENT', issueDate: '2026-01-01', lineItems: [{ id: 1, description: 'Work', qty: 1, unitPrice: 100 }] }],
    });
    await page.goto('/');
    await page.getByTestId('nav-projects').click();
    await page.getByTestId('project-open-1').click();

    await expect(page.getByTestId('invoice-row-1').getByTestId('invoice-due')).toHaveText('2026-01-31');
  });
});
