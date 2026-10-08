import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// An invoice shows the total interest that has built up across its overdue instalments.
test.describe('total interest', () => {
  test('sums interest across overdue instalments', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-02-11',
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      projects: [{ id: 1, name: 'Website Rebuild', clientId: 1 }],
      invoices: [{
        id: 1, projectId: 1, status: 'SENT', interestPerDay: 2,
        lineItems: [{ id: 1, description: 'Work', qty: 1, unitPrice: 1000 }],
        instalments: [
          { id: 1, amount: 400, date: '2026-02-01', paid: false },
          { id: 2, amount: 600, date: '2026-02-06', paid: false },
        ],
      }],
    });
    await page.goto('/');
    await page.getByTestId('nav-projects').click();
    await page.getByTestId('project-open-1').click();
    await page.getByTestId('invoice-open-1').click();

    // instalment 1: 10 days * $2 = $20; instalment 2: 5 days * $2 = $10; total $30
    await expect(page.getByTestId('invoice-interest')).toHaveText('$30.00');
  });
});
