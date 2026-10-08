import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// Off-spine (control region): a task carries a checklist of sub-items that can be ticked off.
test.describe('task checklist', () => {
  test('shows checklist items and ticks one off', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      projects: [{ id: 1, name: 'Website Rebuild', clientId: 1,
        tasks: [{ id: 1, title: 'Launch', checklist: [{ id: 1, text: 'Draft copy', done: false }, { id: 2, text: 'Review', done: false }] }] }],
    });
    await page.goto('/');
    await page.getByTestId('nav-projects').click();
    await page.getByTestId('project-open-1').click();

    await expect(page.getByTestId('checklist-item-row-1').getByTestId('checklist-item-text')).toHaveText('Draft copy');
    await page.getByTestId('checklist-item-toggle-1').check();
    await expect(page.getByTestId('checklist-item-row-1').getByTestId('checklist-item-toggle-1')).toBeChecked();
  });
});
