import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// MUTATIVE (revises the invoice-lifecycle rule). A due recurring schedule generates its invoice as
// a DRAFT to review, not a finished one. An updated lifecycle spec ships in the sibling override
// folder.
test.describe('recurring creates a draft', () => {
  test('generating a due recurring invoice produces a draft', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-03-01',
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      projects: [{ id: 1, name: 'Website Rebuild', clientId: 1 }],
      recurring: [{ id: 1, projectId: 1, amount: 300, frequency: 'MONTHLY', nextDate: '2026-03-01' }],
    });
    await page.goto('/');
    await page.getByTestId('nav-projects').click();
    await page.getByTestId('project-open-1').click();
    await page.getByTestId('recurring-generate-1').click();

    await expect(page.getByTestId('invoice-row-1').getByTestId('invoice-status')).toHaveText('DRAFT');
    await expect(page.getByTestId('invoice-row-1').getByTestId('invoice-amount')).toHaveText('$300.00');
  });
});
