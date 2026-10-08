import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// Off-spine (control region): a job can carry a file reference, shown on the job.
test.describe('job file reference', () => {
  test('shows a job file reference', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      projects: [{ id: 1, name: 'Website Rebuild', clientId: 1, fileRef: 'DOC-2026-014' }],
    });
    await page.goto('/');
    await page.getByTestId('nav-projects').click();
    await page.getByTestId('project-open-1').click();

    await expect(page.getByTestId('job-file-ref')).toHaveText('DOC-2026-014');
  });
});
