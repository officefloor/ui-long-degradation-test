import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// Cross-feature reuse: opening an owner shows that owner's projects — the projects listing rendered
// in the owner context (reuse the project-row-<id>/project-name anchors inside owner-projects-table).
test.describe('owner detail', () => {
  test("lists the owner's projects", { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      owners: [
        { id: 1, name: 'Acme Ltd', email: 'ops@acme.example' },
        { id: 2, name: 'Globex', email: 'ac@globex.example' },
      ],
      projects: [
        { id: 1, name: 'Website Rebuild', ownerId: 1 },
        { id: 2, name: 'Mobile App', ownerId: 1 },
        { id: 3, name: 'Intranet', ownerId: 2 },
      ],
    });
    await page.goto('/');
    await page.getByTestId('nav-owners').click();
    await page.getByTestId('owner-open-1').click();

    const owned = page.getByTestId('owner-projects-table');
    await expect(owned).toBeVisible();
    await expect(owned.getByTestId(/^project-row-/)).toHaveCount(2);
    await expect(owned.getByTestId('project-row-1').getByTestId('project-name')).toHaveText('Website Rebuild');
    await expect(owned.getByTestId('project-row-2').getByTestId('project-name')).toHaveText('Mobile App');
    // Owner 2's project is not shown here.
    await expect(owned.getByTestId('project-row-3')).toHaveCount(0);
  });
});
