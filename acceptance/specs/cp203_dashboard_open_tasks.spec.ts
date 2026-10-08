import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// Off-spine (control region): the home screen shows how many tasks are still open.
test.describe('dashboard open tasks', () => {
  test('counts open tasks', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      projects: [{ id: 1, name: 'A', clientId: 1 }],
      tasks: [
        { id: 1, projectId: 1, title: 'Draft', done: false },
        { id: 2, projectId: 1, title: 'Review', done: false },
        { id: 3, projectId: 1, title: 'Ship', done: true },
      ],
    });
    await page.goto('/');
    await page.getByTestId('nav-dashboard').click();
    await expect(page.getByTestId('dashboard-open-tasks')).toHaveText('2');
  });
});
