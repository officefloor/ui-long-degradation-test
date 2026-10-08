import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// Off-spine (control region): jobs can be reordered and the order is kept.
test.describe('reorder jobs', () => {
  test('moves a job up the list', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      projects: [
        { id: 1, name: 'First', clientId: 1 },
        { id: 2, name: 'Second', clientId: 1 },
      ],
    });
    await page.goto('/');
    await page.getByTestId('nav-projects').click();
    await page.getByTestId('project-move-up-2').click();

    const rows = page.getByTestId(/^project-row-/);
    await expect(rows.nth(0).getByTestId('project-name')).toHaveText('Second');
  });
});
