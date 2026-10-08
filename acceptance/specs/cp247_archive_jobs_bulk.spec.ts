import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// Off-spine (control region): archive all completed jobs in one action. Two finished jobs and one
// active one; after archiving the completed ones, only the active job remains on the list.
test.describe('bulk archive completed jobs', () => {
  test('archives every finished job at once', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      projects: [
        { id: 1, name: 'Live Work', clientId: 1, status: 'ACTIVE' },
        { id: 2, name: 'Done One', clientId: 1, status: 'FINISHED' },
        { id: 3, name: 'Done Two', clientId: 1, status: 'FINISHED' },
      ],
    });
    await page.goto('/');
    await page.getByTestId('nav-projects').click();
    await expect(page.getByTestId(/^project-row-/)).toHaveCount(3);

    await page.getByTestId('jobs-archive-completed').click();

    await expect(page.getByTestId(/^project-row-/)).toHaveCount(1);
    await expect(page.getByTestId('project-row-1')).toBeVisible();
    await expect(page.getByTestId('project-row-2')).toHaveCount(0);
    await expect(page.getByTestId('project-row-3')).toHaveCount(0);
  });
});
