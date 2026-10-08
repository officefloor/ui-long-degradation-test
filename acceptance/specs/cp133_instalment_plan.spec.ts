import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// An invoice can be split into scheduled instalments, each with an amount and a due date.
test.describe('instalment plan', () => {
  test('shows the scheduled instalments', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      projects: [{ id: 1, name: 'Website Rebuild', clientId: 1 }],
      invoices: [{
        id: 1, projectId: 1, status: 'SENT',
        lineItems: [{ id: 1, description: 'Work', qty: 1, unitPrice: 1000 }],
        instalments: [
          { id: 1, amount: 400, date: '2026-02-01' },
          { id: 2, amount: 600, date: '2026-03-01' },
        ],
      }],
    });
    await page.goto('/');
    await page.getByTestId('nav-projects').click();
    await page.getByTestId('project-open-1').click();
    await page.getByTestId('invoice-open-1').click();

    await expect(page.getByTestId('instalment-row-1').getByTestId('instalment-amount')).toHaveText('$400.00');
    await expect(page.getByTestId('instalment-row-1').getByTestId('instalment-date')).toHaveText('2026-02-01');
    await expect(page.getByTestId('instalment-row-2').getByTestId('instalment-amount')).toHaveText('$600.00');
  });
});
