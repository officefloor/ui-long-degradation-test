import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// A recurring schedule can be paused so it stops generating, and resumed later.
test.describe('pause recurring', () => {
  test('pauses and resumes a recurring schedule', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      projects: [{ id: 1, name: 'Website Rebuild', clientId: 1 }],
      recurring: [{ id: 1, projectId: 1, amount: 300, frequency: 'MONTHLY', nextDate: '2026-03-01' }],
    });
    await page.goto('/');
    await page.getByTestId('nav-projects').click();
    await page.getByTestId('project-open-1').click();

    await page.getByTestId('recurring-pause-1').click();
    await expect(page.getByTestId('recurring-row-1').getByTestId('recurring-status')).toHaveText('PAUSED');
    await page.getByTestId('recurring-resume-1').click();
    await expect(page.getByTestId('recurring-row-1').getByTestId('recurring-status')).toHaveText('ACTIVE');
  });
});
