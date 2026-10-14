import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// rank: people sorted by momentum descending; highest momentum is rank 1. Ties broken by name
// ascending (the name earlier in the alphabet gets the lower rank).
const SEED = {
  people: [
    { id: 1, name: 'Ann', alpha: 2,  beta: 25, gamma: 2 },  // momentum 50
    { id: 2, name: 'Bob', alpha: 10, beta: 5,  gamma: 10 }, // momentum 50
    { id: 3, name: 'Cy',  alpha: 5,  beta: 20, gamma: 5 },  // momentum 100
    { id: 4, name: 'Di',  alpha: 4,  beta: 5,  gamma: 4 },  // momentum 20
    { id: 5, name: 'Ed',  alpha: 2,  beta: 5,  gamma: 2 },  // momentum 10
  ],
};

test.describe('rank', () => {
  test('rank orders by momentum desc, ties by name asc', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed(SEED);
    await page.goto('/');
    await page.getByTestId('nav-worksheet').click();

    // Cy 100 -> 1; Ann & Bob tie at 50 -> Ann 2 (name), Bob 3; Di 20 -> 4; Ed 10 -> 5
    await expect(page.getByTestId('person-row-3').getByTestId('concept-rank')).toHaveText('1');
    await expect(page.getByTestId('person-row-1').getByTestId('concept-rank')).toHaveText('2');
    await expect(page.getByTestId('person-row-2').getByTestId('concept-rank')).toHaveText('3');
    await expect(page.getByTestId('person-row-4').getByTestId('concept-rank')).toHaveText('4');
    await expect(page.getByTestId('person-row-5').getByTestId('concept-rank')).toHaveText('5');
  });
});
