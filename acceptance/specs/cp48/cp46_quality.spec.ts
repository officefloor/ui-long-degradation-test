import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../../support/seed';

// UPDATED PRIOR shipped by cp48 (mutates cp46). quality is now simply the score; no score -> n/a.
const SEED = {
  people: [
    { id: 1, name: 'Dana', alpha: 3, beta: 4,  gamma: 10, score: 42 },
    { id: 2, name: 'Ravi', alpha: 7, beta: 2,  gamma: 5,  score: 5 },
    { id: 3, name: 'Uma',  alpha: 5, beta: 20, gamma: 5,  score: null },
  ],
};

test.describe('quality', () => {
  test('quality is the score, n/a without one', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed(SEED);
    await page.goto('/');
    await page.getByTestId('nav-worksheet').click();

    await expect(page.getByTestId('person-row-1').getByTestId('concept-quality')).toHaveText('42');
    await expect(page.getByTestId('person-row-2').getByTestId('concept-quality')).toHaveText('5');
    await expect(page.getByTestId('person-row-3').getByTestId('concept-quality')).toHaveText('n/a');
  });
});
