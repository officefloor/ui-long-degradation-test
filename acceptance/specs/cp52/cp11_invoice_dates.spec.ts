import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// Invoices now carry an issue date and a due date, shown on each invoice row (fixed literal dates).
test.describe('invoice dates', () => {
  test('an invoice shows its issue and due dates', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      projects: [{ id: 1, name: 'Website Rebuild', clientId: 1 }],
      invoices: [{ id: 1, projectId: 1, amount: 100, status: 'SENT', issuedDate: '2026-01-05', dueDate: '2026-02-04' }],
    });
    await page.goto('/');
    await page.getByTestId('nav-jobs').click();
    await page.getByTestId('job-open-1').click();

    await expect(page.getByTestId('invoice-row-1').getByTestId('invoice-issued')).toHaveText('2026-01-05');
    await expect(page.getByTestId('invoice-row-1').getByTestId('invoice-due')).toHaveText('2026-02-04');
  });
});
