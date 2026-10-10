import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// Projects can be filtered by two things at once: status and label together. The chosen filters
// stay in place after opening a project and coming back to the project list.
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

    // Open the project, then come back to the list: both filters are still applied.
    await page.getByTestId('project-open-1').click();
    await expect(page.getByTestId('invoice-form-amount')).toBeVisible();
    await page.getByTestId('nav-projects').click();
    await expect(page.getByTestId('project-status-filter')).toHaveValue('ACTIVE');
    await expect(page.getByTestId('project-tag-filter')).toHaveValue('1');
    await expect(page.getByTestId(/^project-row-/)).toHaveCount(1);
    await expect(page.getByTestId('project-row-1').getByTestId('project-name')).toHaveText('Alpha');
  });
});
