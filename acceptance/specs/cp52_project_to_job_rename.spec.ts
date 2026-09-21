import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// A pure RELABEL: the word shown to the user changes from "project" to "job". This is a visible-text
// change, NOT an interface change — the data-testid contract is the stable anchor the whole suite
// binds to and must NOT change (CLAUDE.md says so). So this spec keeps the existing project-* testids
// and asserts only that the VISIBLE TEXT now reads "job". (The seed fixture keeps its `projects` key
// — this is a UI relabel, not a data change.)
test.describe('projects relabelled to jobs', () => {
  test('the section reads "job" while its testids stay unchanged', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      projects: [{ id: 1, name: 'Website Rebuild', clientId: 1 }],
    });
    await page.goto('/');

    // The nav link keeps its stable testid but now shows the new word.
    await expect(page.getByTestId('nav-projects')).toContainText(/job/i);
    await expect(page.getByTestId('nav-projects')).not.toContainText(/project/i);
    await page.getByTestId('nav-projects').click();

    // The list still works through the same stable testids.
    await expect(page.getByTestId('projects-table')).toBeVisible();
    await expect(page.getByTestId('project-row-1').getByTestId('project-name')).toHaveText('Website Rebuild');

    // The add-form action label also reads the new word.
    await expect(page.getByTestId('project-form-submit')).toContainText(/job/i);
  });
});
