import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// Off-spine (control region): a job has a start date and an end date, shown on the job.
test.describe('job dates', () => {
  test('shows a job start and end date', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      projects: [{ id: 1, name: 'Website Rebuild', clientId: 1, startDate: '2026-01-05', endDate: '2026-04-30' }],
    });
    await page.goto('/');
    await page.getByTestId('nav-projects').click();
    await page.getByTestId('project-open-1').click();

    await expect(page.getByTestId('job-start-date')).toHaveText('2026-01-05');
    await expect(page.getByTestId('job-end-date')).toHaveText('2026-04-30');
  });
});
