import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// Projects can be labelled with tags (chips), added and removed.
test.describe('project tags', () => {
  test('shows, adds and removes tags on a project', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      projects: [{ id: 1, name: 'Website Rebuild', clientId: 1 }],
      tags: [{ id: 1, name: 'urgent' }, { id: 2, name: 'retainer' }],
      projectTags: [{ projectId: 1, tagId: 1 }],
    });
    await page.goto('/');
    await page.getByTestId('nav-jobs').click();
    await page.getByTestId('job-open-1').click();

    await expect(page.getByTestId('job-tag-1')).toHaveText('urgent');
    await expect(page.getByTestId('job-tag-2')).toHaveCount(0);

    await page.getByTestId('job-tag-add').selectOption('2');
    await page.getByTestId('job-tag-add-submit').click();
    await expect(page.getByTestId('job-tag-2')).toHaveText('retainer');

    await page.getByTestId('job-tag-remove-1').click();
    await expect(page.getByTestId('job-tag-1')).toHaveCount(0);
  });
});
