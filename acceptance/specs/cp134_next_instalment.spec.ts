import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// An invoice on a plan shows the next instalment due and its date, measured against the reference
// date.
test.describe('next instalment', () => {
  test('shows the next unpaid instalment due', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-02-15',
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      projects: [{ id: 1, name: 'Website Rebuild', clientId: 1 }],
      invoices: [{
        id: 1, projectId: 1, status: 'SENT',
        lineItems: [{ id: 1, description: 'Work', qty: 1, unitPrice: 1000 }],
        instalments: [
          { id: 1, amount: 400, date: '2026-02-01', paid: true },
          { id: 2, amount: 600, date: '2026-03-01', paid: false },
        ],
      }],
    });
    await page.goto('/');
    await page.getByTestId('nav-projects').click();
    await page.getByTestId('project-open-1').click();
    await page.getByTestId('invoice-open-1').click();

    await expect(page.getByTestId('instalment-next-amount')).toHaveText('$600.00');
    await expect(page.getByTestId('instalment-next-date')).toHaveText('2026-03-01');
  });
});
