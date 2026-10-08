import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// Off-spine (control region): a task can be assigned to a person, whose name is shown.
test.describe('task assignee', () => {
  test('shows who a task is for', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      projects: [{ id: 1, name: 'Website Rebuild', clientId: 1 }],
      tasks: [{ id: 1, projectId: 1, title: 'Wireframes', assignee: 'Sam Rivera' }],
    });
    await page.goto('/');
    await page.getByTestId('nav-projects').click();
    await page.getByTestId('project-open-1').click();

    await expect(page.getByTestId('task-row-1').getByTestId('task-assignee')).toHaveText('Sam Rivera');
  });
});
