import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// Off-spine (control region): a job can be marked billable or not, shown on the job. Jobs keep the
// project-* anchors.
test.describe('job billable flag', () => {
  test('shows whether a job is billable', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      projects: [{ id: 1, name: 'Internal Tooling', clientId: 1, billable: false }],
    });
    await page.goto('/');
    await page.getByTestId('nav-projects').click();
    await page.getByTestId('project-open-1').click();

    await expect(page.getByTestId('project-billable')).toHaveText('Non-billable');
  });
});
