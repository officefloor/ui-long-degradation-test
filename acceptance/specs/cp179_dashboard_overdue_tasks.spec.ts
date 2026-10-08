import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// Off-spine (control region): the home screen shows how many tasks are overdue against the
// reference date.
test.describe('dashboard overdue tasks', () => {
  test('counts overdue tasks', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-03-01',
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      projects: [{ id: 1, name: 'Website Rebuild', clientId: 1, tasks: [
        { id: 1, title: 'A', dueDate: '2026-02-01', done: false },
        { id: 2, title: 'B', dueDate: '2026-02-15', done: false },
        { id: 3, title: 'C', dueDate: '2026-04-01', done: false },
      ] }],
    });
    await page.goto('/');
    await page.getByTestId('nav-dashboard').click();

    await expect(page.getByTestId('dashboard-overdue-tasks-count')).toHaveText('2');
  });
});
