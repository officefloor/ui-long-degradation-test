import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// Off-spine (control region): tasks can be filtered by who they are assigned to.
test.describe('filter tasks by assignee', () => {
  test('shows only the selected assignee tasks', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      projects: [{ id: 1, name: 'Website Rebuild', clientId: 1, tasks: [
        { id: 1, title: 'Design', assignee: 'Dana Lee' },
        { id: 2, title: 'Build', assignee: 'Sam Okoro' },
      ] }],
    });
    await page.goto('/');
    await page.getByTestId('nav-projects').click();
    await page.getByTestId('project-open-1').click();

    await page.getByTestId('task-filter').selectOption('Dana Lee');
    await expect(page.getByTestId(/^task-row-/)).toHaveCount(1);
    await expect(page.getByTestId('task-row-1').getByTestId('task-assignee')).toHaveText('Dana Lee');
  });
});
