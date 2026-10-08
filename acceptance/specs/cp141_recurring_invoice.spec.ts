import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// A recurring invoice repeats monthly for a fixed amount; it is listed as a recurring schedule.
test.describe('recurring invoice', () => {
  test('shows a monthly recurring schedule', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      projects: [{ id: 1, name: 'Website Rebuild', clientId: 1 }],
      recurring: [{ id: 1, projectId: 1, amount: 300, frequency: 'MONTHLY', nextDate: '2026-03-01' }],
    });
    await page.goto('/');
    await page.getByTestId('nav-projects').click();
    await page.getByTestId('project-open-1').click();

    await expect(page.getByTestId('recurring-row-1').getByTestId('recurring-amount')).toHaveText('$300.00');
    await expect(page.getByTestId('recurring-row-1').getByTestId('recurring-frequency')).toHaveText('MONTHLY');
  });
});
