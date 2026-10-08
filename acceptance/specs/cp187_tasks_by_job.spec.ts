import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// Off-spine (control region): tasks grouped by the job they belong to.
test.describe('tasks by job', () => {
  test('groups tasks under their job', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      projects: [
        { id: 1, name: 'Website Rebuild', clientId: 1 },
        { id: 2, name: 'Intranet', clientId: 1 },
      ],
      tasks: [
        { id: 1, projectId: 1, title: 'Draft' },
        { id: 2, projectId: 1, title: 'Review' },
        { id: 3, projectId: 2, title: 'Plan' },
      ],
    });
    await page.goto('/');
    await page.getByTestId('nav-projects').click();
    await page.getByTestId('tasks-by-job-open').click();

    await expect(page.getByTestId('task-group-1').getByTestId(/^task-row-/)).toHaveCount(2);
    await expect(page.getByTestId('task-group-2').getByTestId(/^task-row-/)).toHaveCount(1);
  });
});
