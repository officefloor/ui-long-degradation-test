import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// Projects can be filtered by two things at once: status and label together.
test.describe('combined project filter', () => {
  test('shows active projects with the chosen label', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      projects: [
        { id: 1, name: 'Alpha', clientId: 1, status: 'ACTIVE' },
        { id: 2, name: 'Beta', clientId: 1, status: 'ACTIVE' },
        { id: 3, name: 'Gamma', clientId: 1, status: 'ON_HOLD' },
      ],
      tags: [{ id: 1, name: 'urgent' }, { id: 2, name: 'later' }],
      projectTags: [
        { projectId: 1, tagId: 1 },
        { projectId: 2, tagId: 2 },
        { projectId: 3, tagId: 1 },
      ],
    });
    await page.goto('/');
    await page.getByTestId('nav-projects').click();
    await page.getByTestId('project-status-filter').selectOption('ACTIVE');
    await page.getByTestId('project-tag-filter').selectOption('1');

    await expect(page.getByTestId(/^project-row-/)).toHaveCount(1);
    await expect(page.getByTestId('project-row-1').getByTestId('project-name')).toHaveText('Alpha');
  });
});
