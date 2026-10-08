import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// Interest accrues on an instalment paid late, worked out from how many days late it is against the
// reference date.
test.describe('overdue instalment interest', () => {
  test('shows interest on an overdue instalment', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-02-11',
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      projects: [{ id: 1, name: 'Website Rebuild', clientId: 1 }],
      invoices: [{
        id: 1, projectId: 1, status: 'SENT', interestPerDay: 2,
        lineItems: [{ id: 1, description: 'Work', qty: 1, unitPrice: 1000 }],
        instalments: [{ id: 1, amount: 400, date: '2026-02-01', paid: false }],
      }],
    });
    await page.goto('/');
    await page.getByTestId('nav-projects').click();
    await page.getByTestId('project-open-1').click();
    await page.getByTestId('invoice-open-1').click();

    // 10 days late at $2/day = $20.00
    await expect(page.getByTestId('instalment-row-1').getByTestId('instalment-interest')).toHaveText('$20.00');
  });
});
