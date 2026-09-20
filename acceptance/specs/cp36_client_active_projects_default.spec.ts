import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// A client's page now shows only their ACTIVE projects by default, with a toggle to also show the
// finished and hidden (archived) ones.
test.describe('client active projects by default', () => {
  test('shows active projects, with a toggle for the rest', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      projects: [
        { id: 1, name: 'Website Rebuild', clientId: 1, status: 'ACTIVE' },
        { id: 2, name: 'Old Site', clientId: 1, status: 'FINISHED' },
        { id: 3, name: 'Archived One', clientId: 1, status: 'ACTIVE', archived: true },
      ],
    });
    await page.goto('/');
    await page.getByTestId('nav-clients').click();
    await page.getByTestId('client-open-1').click();

    const table = page.getByTestId('client-projects-table');
    await expect(table.getByTestId(/^project-row-/)).toHaveCount(1);
    await expect(table.getByTestId('project-row-1').getByTestId('project-name')).toHaveText('Website Rebuild');

    await page.getByTestId('client-projects-show-all').click();
    await expect(table.getByTestId(/^project-row-/)).toHaveCount(3);
  });
});
