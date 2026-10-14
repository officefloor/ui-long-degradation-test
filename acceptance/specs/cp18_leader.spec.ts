import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// leader rollup: the name of the rank-1 person.
test.describe('leader', () => {
  test('leader is the rank-1 person', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      people: [
        { id: 1, name: 'Ann', alpha: 2,  beta: 25, gamma: 2 },  // momentum 50
        { id: 2, name: 'Cy',  alpha: 5,  beta: 20, gamma: 5 },  // momentum 100 -> rank 1
        { id: 3, name: 'Di',  alpha: 4,  beta: 5,  gamma: 4 },  // momentum 20
      ],
    });
    await page.goto('/');

    await expect(page.getByTestId('rollup-leader')).toHaveText('Cy');
  });
});
