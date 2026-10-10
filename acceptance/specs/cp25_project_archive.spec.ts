import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';
import { auditLines } from '../support/audit';

// Projects are archived rather than deleted: an archived project drops off the list but is retained
// (a toggle reveals archived ones), and archiving records an audit line.
test.describe('archive a project', () => {
  test('archiving hides the project but keeps it', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      projects: [
        { id: 1, name: 'Website Rebuild', clientId: 1 },
        { id: 2, name: 'Intranet', clientId: 1 },
        { id: 3, name: 'Old Brochure', clientId: 1, archived: true },
      ],
    });
    await page.goto('/');
    await page.getByTestId('nav-projects').click();

    // A project that is already archived starts off the list.
    await expect(page.getByTestId('project-row-2')).toBeVisible();
    await expect(page.getByTestId('project-row-3')).toHaveCount(0);

    await page.getByTestId('project-archive-1').click();
    await expect(page.getByTestId('project-row-1')).toHaveCount(0);
    expect(auditLines()).toContain('PROJECT_ARCHIVED id=1');

    // It is retained: revealing archived projects brings it back.
    await page.getByTestId('projects-show-archived').click();
    await expect(page.getByTestId('project-row-1')).toBeVisible();
    await expect(page.getByTestId('project-row-3')).toBeVisible();
  });
});
