import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// UPDATED (projects can be archived): a client's page excludes archived projects, and still lists
// ALL of that client's other projects (and none of another client's).
test.describe('client detail', () => {
  test("lists the client's projects, excluding archived", { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      clients: [
        { id: 1, name: 'Acme Ltd', email: 'ops@acme.example' },
        { id: 2, name: 'Globex', email: 'ac@globex.example' },
      ],
      projects: [
        { id: 1, name: 'Website Rebuild', clientId: 1 },
        { id: 2, name: 'Mobile App', clientId: 1, archived: true },
        { id: 3, name: 'Intranet', clientId: 2 },
        { id: 4, name: 'Support Retainer', clientId: 1 },
      ],
    });
    await page.goto('/');
    await page.getByTestId('nav-clients').click();
    await page.getByTestId('client-open-1').click();

    const owned = page.getByTestId('client-projects-table');
    await expect(owned).toBeVisible();
    await expect(owned.getByTestId(/^project-row-/)).toHaveCount(2);
    await expect(owned.getByTestId('project-row-1').getByTestId('project-name')).toHaveText('Website Rebuild');
    await expect(owned.getByTestId('project-row-4').getByTestId('project-name')).toHaveText('Support Retainer');
    await expect(owned.getByTestId('project-row-2')).toHaveCount(0);
    await expect(owned.getByTestId('project-row-3')).toHaveCount(0);
  });
});
