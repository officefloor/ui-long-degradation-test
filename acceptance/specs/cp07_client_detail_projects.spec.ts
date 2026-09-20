import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// Cross-feature reuse: opening a client shows that client's projects — the projects listing rendered
// in the client context (reuse the project-row-<id>/project-name anchors inside client-projects-table).
test.describe('client detail', () => {
  test("lists the client's projects", { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      clients: [
        { id: 1, name: 'Acme Ltd', email: 'ops@acme.example' },
        { id: 2, name: 'Globex', email: 'ac@globex.example' },
      ],
      projects: [
        { id: 1, name: 'Website Rebuild', clientId: 1 },
        { id: 2, name: 'Mobile App', clientId: 1 },
        { id: 3, name: 'Intranet', clientId: 2 },
      ],
    });
    await page.goto('/');
    await page.getByTestId('nav-clients').click();
    await page.getByTestId('client-open-1').click();

    const owned = page.getByTestId('client-projects-table');
    await expect(owned).toBeVisible();
    await expect(owned.getByTestId(/^project-row-/)).toHaveCount(2);
    await expect(owned.getByTestId('project-row-1').getByTestId('project-name')).toHaveText('Website Rebuild');
    await expect(owned.getByTestId('project-row-2').getByTestId('project-name')).toHaveText('Mobile App');
    // Client 2's project is not shown here.
    await expect(owned.getByTestId('project-row-3')).toHaveCount(0);
  });
});
