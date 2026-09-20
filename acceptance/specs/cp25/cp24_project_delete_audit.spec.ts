import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../../support/seed';
import { auditLines } from '../../support/audit';

// UPDATED (delete now archives): removing a project archives it instead of deleting. It drops off
// the list but is retained, and the audit line is PROJECT_ARCHIVED (not PROJECT_DELETED).
test.describe('remove a project', () => {
  test('removing archives the project and records it', { tag: '@functionality' }, async ({ page }) => {
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

    await page.getByTestId('project-archive-1').click();
    await expect(page.getByTestId('project-row-1')).toHaveCount(0);
    await expect(page.getByTestId(/^project-row-/)).toHaveCount(1);
    expect(auditLines()).toContain('PROJECT_ARCHIVED id=1');
  });
});
