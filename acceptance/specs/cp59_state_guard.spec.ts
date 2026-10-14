import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// State guard: `person-demote-<id>` moves a person back one step, EXCEPT a FINAL person cannot go
// back. Trying to demote a FINAL person shows `person-state-error` and leaves the state at FINAL.
test.describe('state guard', () => {
  test('FINAL cannot go back; other states can', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      people: [
        { id: 1, name: 'Al',  alpha: 5, beta: 20, gamma: 5, state: 'FINAL' },
        { id: 2, name: 'Bob', alpha: 7, beta: 2,  gamma: 5, state: 'REVIEW' },
      ],
    });
    await page.goto('/');

    // FINAL is blocked
    await page.getByTestId('person-demote-1').click();
    await expect(page.getByTestId('person-state-error')).toBeVisible();
    await expect(page.getByTestId('person-row-1').getByTestId('person-state')).toHaveText('FINAL');

    // REVIEW can go back to DRAFT
    await page.getByTestId('person-demote-2').click();
    await expect(page.getByTestId('person-row-2').getByTestId('person-state')).toHaveText('DRAFT');
  });
});
