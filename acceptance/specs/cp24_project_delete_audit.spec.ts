import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';
import { auditLines } from '../support/audit';

// Deleting a project removes it from the list and records an audit line.
test.describe('delete a project', () => {
  test('deleting removes the project and records it', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      projects: [
        { id: 1, name: 'Website Rebuild', clientId: 1 },
        { id: 2, name: 'Intranet', clientId: 1 },
      ],
    });
    await page.goto('/');
    await page.getByTestId('nav-projects').click();
    await expect(page.getByTestId(/^project-row-/)).toHaveCount(2);

    await page.getByTestId('project-delete-1').click();
    await expect(page.getByTestId('project-row-1')).toHaveCount(0);
    await expect(page.getByTestId(/^project-row-/)).toHaveCount(1);
    expect(auditLines()).toContain('PROJECT_DELETED id=1');
  });
});
