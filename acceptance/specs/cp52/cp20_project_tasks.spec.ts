import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// Each project keeps a task list; tasks can be ticked off (OPEN <-> DONE).
test.describe('project tasks', () => {
  test('lists tasks and lets me tick one off', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      projects: [{ id: 1, name: 'Website Rebuild', clientId: 1 }],
      tasks: [
        { id: 1, projectId: 1, title: 'Wireframes', done: false },
        { id: 2, projectId: 1, title: 'Copy review', done: false },
      ],
    });
    await page.goto('/');
    await page.getByTestId('nav-jobs').click();
    await page.getByTestId('job-open-1').click();

    await expect(page.getByTestId('job-tasks-table')).toBeVisible();
    await expect(page.getByTestId('task-row-1').getByTestId('task-title')).toHaveText('Wireframes');
    await expect(page.getByTestId('task-row-1').getByTestId('task-status')).toHaveText('OPEN');

    await page.getByTestId('task-toggle-1').click();
    await expect(page.getByTestId('task-row-1').getByTestId('task-status')).toHaveText('DONE');
  });
});
