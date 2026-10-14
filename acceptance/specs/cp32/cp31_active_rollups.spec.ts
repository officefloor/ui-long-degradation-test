import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../../support/seed';

// UPDATED PRIOR shipped by cp32 (mutates cp31). total effective reflects the halved inactive values;
// active count is unchanged.
const SEED = {
  people: [
    { id: 1, name: 'Dana', alpha: 3, beta: 4,  gamma: 10, active: true },  // effective 33
    { id: 2, name: 'Ravi', alpha: 7, beta: 2,  gamma: 5,  active: false }, // effective 4
    { id: 3, name: 'Uma',  alpha: 5, beta: 20, gamma: 5,  active: true },  // effective 100
    { id: 4, name: 'Odd',  alpha: 3, beta: 3,  gamma: 3,  active: false }, // effective 4
  ],
};

test.describe('active rollups', () => {
  test('active count and total effective', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed(SEED);
    await page.goto('/');
    await page.getByTestId('nav-worksheet').click();

    await expect(page.getByTestId('rollup-active-count')).toHaveText('2');
    await expect(page.getByTestId('rollup-total-effective')).toHaveText('141'); // 33 + 4 + 100 + 4
  });
});
