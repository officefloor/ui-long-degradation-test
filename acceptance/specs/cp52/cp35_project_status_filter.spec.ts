import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// Filter the projects list by active / on hold / finished.
test.describe('filter projects by status', () => {
  test('shows only projects at the chosen status', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      projects: [
        { id: 1, name: 'Website Rebuild', clientId: 1, status: 'ACTIVE' },
        { id: 2, name: 'Intranet', clientId: 1, status: 'ON_HOLD' },
        { id: 3, name: 'Mobile App', clientId: 1, status: 'ACTIVE' },
      ],
    });
    await page.goto('/');
    await page.getByTestId('nav-jobs').click();
    await expect(page.getByTestId(/^job-row-/)).toHaveCount(3);

    await page.getByTestId('job-status-filter').selectOption('ACTIVE');
    await expect(page.getByTestId(/^job-row-/)).toHaveCount(2);
    await expect(page.getByTestId('job-row-2')).toHaveCount(0);
  });
});
