import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// MUTATIVE (mutates cp17, cp19): momentum ties are now broken by higher alpha (was name asc). Rank
// changes for tied people, which also changes their percentile. Updated cp17 and cp19 ship under
// acceptance/specs/cp20/.
const SEED = {
  people: [
    { id: 1, name: 'Ann', alpha: 2,  beta: 25, gamma: 2 },  // momentum 50, alpha 2
    { id: 2, name: 'Bob', alpha: 10, beta: 5,  gamma: 10 }, // momentum 50, alpha 10
    { id: 3, name: 'Cy',  alpha: 5,  beta: 20, gamma: 5 },  // momentum 100
    { id: 4, name: 'Di',  alpha: 4,  beta: 5,  gamma: 4 },  // momentum 20
    { id: 5, name: 'Ed',  alpha: 2,  beta: 5,  gamma: 2 },  // momentum 10
  ],
};

test.describe('rank tie-break by alpha', () => {
  test('a momentum tie is broken by higher alpha', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed(SEED);
    await page.goto('/');
    await page.getByTestId('nav-worksheet').click();

    // Cy 100 -> 1; tie at 50 now by alpha: Bob(10) -> 2, Ann(2) -> 3; Di -> 4; Ed -> 5
    await expect(page.getByTestId('person-row-3').getByTestId('concept-rank')).toHaveText('1');
    await expect(page.getByTestId('person-row-2').getByTestId('concept-rank')).toHaveText('2');
    await expect(page.getByTestId('person-row-1').getByTestId('concept-rank')).toHaveText('3');
    await expect(page.getByTestId('person-row-4').getByTestId('concept-rank')).toHaveText('4');
    await expect(page.getByTestId('person-row-5').getByTestId('concept-rank')).toHaveText('5');
  });
});
