import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// Off-spine (control region): a job carries a short description, shown on the job. Jobs were
// projects until an earlier relabel; the data-testid anchors stay project-* (stable contract),
// only the visible wording is "job". Anchor: job-description.
test.describe('job description', () => {
  test('shows a job description', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      projects: [{ id: 1, name: 'Website Rebuild', clientId: 1, description: 'Full rebuild of the marketing site.' }],
    });
    await page.goto('/');
    await page.getByTestId('nav-projects').click();
    await page.getByTestId('project-open-1').click();

    await expect(page.getByTestId('job-description')).toHaveText('Full rebuild of the marketing site.');
  });
});
