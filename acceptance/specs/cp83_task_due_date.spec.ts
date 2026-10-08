import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// Off-spine (control region): a task carries a due date, shown on the task.
test.describe('task due date', () => {
  test('shows a task due date', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      projects: [{ id: 1, name: 'Website Rebuild', clientId: 1 }],
      tasks: [{ id: 1, projectId: 1, title: 'Wireframes', dueDate: '2026-03-01' }],
    });
    await page.goto('/');
    await page.getByTestId('nav-projects').click();
    await page.getByTestId('project-open-1').click();

    await expect(page.getByTestId('task-row-1').getByTestId('task-due-date')).toHaveText('2026-03-01');
  });
});
