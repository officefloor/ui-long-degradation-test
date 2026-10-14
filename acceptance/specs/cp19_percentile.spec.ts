import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// percentile from rank: best is 100, worst is 0, spread evenly by rank. With N people,
// percentile = (N - rank) / (N - 1) * 100. A single person is 100.

test.describe('percentile', () => {
  test('percentile spreads 100..0 evenly by rank', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
  people: [
    { id: 1, name: 'Ann', alpha: 2,  beta: 25, gamma: 2 },  // momentum 50  -> rank 2
    { id: 2, name: 'Bob', alpha: 10, beta: 5,  gamma: 10 }, // momentum 50  -> rank 3
    { id: 3, name: 'Cy',  alpha: 5,  beta: 20, gamma: 5 },  // momentum 100 -> rank 1
    { id: 4, name: 'Di',  alpha: 4,  beta: 5,  gamma: 4 },  // momentum 20  -> rank 4
    { id: 5, name: 'Ed',  alpha: 2,  beta: 5,  gamma: 2 },  // momentum 10  -> rank 5
  ],
});
    await page.goto('/');

    // N=5: rank 1->100, 2->75, 3->50, 4->25, 5->0
    await expect(page.getByTestId('person-row-3').getByTestId('concept-percentile')).toHaveText('100');
    await expect(page.getByTestId('person-row-1').getByTestId('concept-percentile')).toHaveText('75');
    await expect(page.getByTestId('person-row-2').getByTestId('concept-percentile')).toHaveText('50');
    await expect(page.getByTestId('person-row-4').getByTestId('concept-percentile')).toHaveText('25');
    await expect(page.getByTestId('person-row-5').getByTestId('concept-percentile')).toHaveText('0');
  });
});
