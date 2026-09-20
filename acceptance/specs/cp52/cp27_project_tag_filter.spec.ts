import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// Filter the projects list by tag.
test.describe('filter projects by tag', () => {
  test('shows only projects with the chosen tag', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      projects: [
        { id: 1, name: 'Website Rebuild', clientId: 1 },
        { id: 2, name: 'Intranet', clientId: 1 },
        { id: 3, name: 'Mobile App', clientId: 1 },
      ],
      tags: [{ id: 1, name: 'urgent' }],
      projectTags: [{ projectId: 1, tagId: 1 }, { projectId: 3, tagId: 1 }],
    });
    await page.goto('/');
    await page.getByTestId('nav-jobs').click();
    await expect(page.getByTestId(/^job-row-/)).toHaveCount(3);

    await page.getByTestId('job-tag-filter').selectOption('1');
    await expect(page.getByTestId(/^job-row-/)).toHaveCount(2);
    await expect(page.getByTestId('job-row-1')).toBeVisible();
    await expect(page.getByTestId('job-row-2')).toHaveCount(0);
    await expect(page.getByTestId('job-row-3')).toBeVisible();
  });
});
