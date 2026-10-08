import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// Off-spine (control region): tasks due this week shown on the home screen.
test.describe('dashboard tasks this week', () => {
  test('counts tasks due in the current week', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-02-04',
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      projects: [{ id: 1, name: 'A', clientId: 1 }],
      tasks: [
        { id: 1, projectId: 1, title: 'a', dueDate: '2026-02-05' },
        { id: 2, projectId: 1, title: 'b', dueDate: '2026-02-20' },
      ],
    });
    await page.goto('/');
    await page.getByTestId('nav-dashboard').click();
    await expect(page.getByTestId('dashboard-tasks-week')).toHaveText('1');
  });
});
