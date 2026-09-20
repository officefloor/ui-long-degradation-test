import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// The word "project" is renamed to "job" throughout the interface. The navigation, lists, headings
// and controls now say "job". (The seed fixture keeps its `projects` key — this is a UI relabel,
// not a data change.)
test.describe('projects renamed to jobs', () => {
  test('the jobs section replaces projects', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      projects: [{ id: 1, name: 'Website Rebuild', clientId: 1 }],
    });
    await page.goto('/');
    await expect(page.getByTestId('nav-projects')).toHaveCount(0);
    await page.getByTestId('nav-jobs').click();

    await expect(page.getByTestId('jobs-table')).toBeVisible();
    await expect(page.getByTestId('job-row-1').getByTestId('job-name')).toHaveText('Website Rebuild');
    await expect(page.getByTestId('job-row-1').getByTestId('job-client')).toHaveText('Acme Ltd');
  });
});
