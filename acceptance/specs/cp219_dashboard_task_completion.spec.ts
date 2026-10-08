import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// Off-spine (control region): the share of tasks completed, on the home screen.
test.describe('dashboard task completion', () => {
  test('shows the completion rate', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      projects: [{ id: 1, name: 'A', clientId: 1 }],
      tasks: [
        { id: 1, projectId: 1, title: 'a', done: true },
        { id: 2, projectId: 1, title: 'b', done: true },
        { id: 3, projectId: 1, title: 'c', done: false },
        { id: 4, projectId: 1, title: 'd', done: false },
      ],
    });
    await page.goto('/');
    await page.getByTestId('nav-dashboard').click();
    await expect(page.getByTestId('dashboard-task-completion')).toHaveText('50%');
  });
});
