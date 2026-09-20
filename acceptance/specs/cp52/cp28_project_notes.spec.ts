import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// Notes on a project, newest first, with a form to add one.
test.describe('project notes', () => {
  test('shows notes newest first and adds a new one on top', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      projects: [{ id: 1, name: 'Website Rebuild', clientId: 1 }],
      notes: [
        { id: 1, targetType: 'project', targetId: 1, text: 'Kickoff call done', at: '2026-01-02T09:00:00Z' },
        { id: 2, targetType: 'project', targetId: 1, text: 'Sent first draft', at: '2026-01-05T09:00:00Z' },
      ],
    });
    await page.goto('/');
    await page.getByTestId('nav-jobs').click();
    await page.getByTestId('job-open-1').click();

    const notes = page.getByTestId(/^note-row-/);
    await expect(notes.nth(0).getByTestId('note-text')).toHaveText('Sent first draft');
    await expect(notes.nth(1).getByTestId('note-text')).toHaveText('Kickoff call done');

    await page.getByTestId('note-form-text').fill('Client approved');
    await page.getByTestId('note-form-submit').click();
    await expect(page.getByTestId(/^note-row-/).nth(0).getByTestId('note-text')).toHaveText('Client approved');
  });
});
