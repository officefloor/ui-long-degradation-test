import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// Filter a project's tasks to just the open ones or just the finished ones.
test.describe('filter tasks', () => {
  test('shows only open or only done tasks', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      projects: [{ id: 1, name: 'Website Rebuild', clientId: 1 }],
      tasks: [
        { id: 1, projectId: 1, title: 'Wireframes', done: false },
        { id: 2, projectId: 1, title: 'Copy review', done: false },
        { id: 3, projectId: 1, title: 'Launch', done: true },
      ],
    });
    await page.goto('/');
    await page.getByTestId('nav-projects').click();
    await page.getByTestId('project-open-1').click();
    await expect(page.getByTestId(/^task-row-/)).toHaveCount(3);

    await page.getByTestId('task-filter').selectOption('OPEN');
    await expect(page.getByTestId(/^task-row-/)).toHaveCount(2);

    await page.getByTestId('task-filter').selectOption('DONE');
    await expect(page.getByTestId(/^task-row-/)).toHaveCount(1);
    await expect(page.getByTestId('task-row-3').getByTestId('task-title')).toHaveText('Launch');
  });
});
