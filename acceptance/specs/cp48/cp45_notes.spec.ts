import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// that one score (empty when none) and note-sum equals the score.

test.describe('notes', () => {
  test('shows the single score and its total', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
  people: [
    { id: 1, name: 'Dana', alpha: 3, beta: 4,  gamma: 10, score: 42 },
    { id: 2, name: 'Ravi', alpha: 7, beta: 2,  gamma: 5,  score: 5 },
    { id: 3, name: 'Uma',  alpha: 5, beta: 20, gamma: 5,  score: null },
  ],
});
    await page.goto('/');

    await expect(page.getByTestId('person-row-1').getByTestId('person-notes')).toHaveText('42');
    await expect(page.getByTestId('person-row-2').getByTestId('person-notes')).toHaveText('5');
    await expect(page.getByTestId('person-row-3').getByTestId('person-notes')).toHaveText('');

    await expect(page.getByTestId('person-row-1').getByTestId('concept-note-sum')).toHaveText('42');
    await expect(page.getByTestId('person-row-2').getByTestId('concept-note-sum')).toHaveText('5');
    await expect(page.getByTestId('person-row-3').getByTestId('concept-note-sum')).toHaveText('0');
  });
});
