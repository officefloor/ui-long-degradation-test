import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// The first invoice from a recurring schedule is pro-rated by the number of days left in the
// period.
test.describe('pro-rate first recurring', () => {
  test('pro-rates the first recurring invoice', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-03-16',
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      projects: [{ id: 1, name: 'Website Rebuild', clientId: 1 }],
      // starts halfway through a 30-day period: 15 of 30 days -> half of $300
      recurring: [{ id: 1, projectId: 1, amount: 300, frequency: 'MONTHLY', nextDate: '2026-03-16', periodDays: 30, prorateFirst: true }],
    });
    await page.goto('/');
    await page.getByTestId('nav-projects').click();
    await page.getByTestId('project-open-1').click();

    await expect(page.getByTestId('recurring-row-1').getByTestId('recurring-prorated-amount')).toHaveText('$150.00');
  });
});
