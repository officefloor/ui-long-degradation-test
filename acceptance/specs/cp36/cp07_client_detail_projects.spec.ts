import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// UPDATED (active-by-default): a client's page lists only their ACTIVE, non-archived projects by
// default. Carries forward the archived exclusion.
test.describe('client detail', () => {
  test("lists the client's active projects by default", { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      clients: [
        { id: 1, name: 'Acme Ltd', email: 'ops@acme.example' },
        { id: 2, name: 'Globex', email: 'ac@globex.example' },
      ],
      projects: [
        { id: 1, name: 'Website Rebuild', clientId: 1, status: 'ACTIVE' },
        { id: 2, name: 'Mobile App', clientId: 1, status: 'ACTIVE', archived: true },
        { id: 4, name: 'Old Site', clientId: 1, status: 'FINISHED' },
        { id: 3, name: 'Intranet', clientId: 2, status: 'ACTIVE' },
      ],
    });
    await page.goto('/');
    await page.getByTestId('nav-clients').click();
    await page.getByTestId('client-open-1').click();

    const owned = page.getByTestId('client-projects-table');
    await expect(owned.getByTestId(/^project-row-/)).toHaveCount(1);
    await expect(owned.getByTestId('project-row-1').getByTestId('project-name')).toHaveText('Website Rebuild');
    await expect(owned.getByTestId('project-row-2')).toHaveCount(0);
    await expect(owned.getByTestId('project-row-4')).toHaveCount(0);
  });
});
