import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// MUTATIVE (mutates cp113, cp114, cp115): ebb now subtracts the MEAN of blend (floor), not the
// median. That changes every ebb, flips strays and the count.
//   mean = (40+60+80+240+900)/5 = 264
//   ebb: -224, -204, -184, -24, 636 ; stray: yes, yes, yes, no, yes -> count 4
// Updated cp113/cp114/cp115 ship under acceptance/specs/cp116/.
const SEED = {
  people: [
    { id: 1, name: 'Fay', alpha: 5,  beta: 8,  gamma: 5,  delta: 0, epsilon: 0, zeta: 0, active: true },
    { id: 2, name: 'Gus', alpha: 2,  beta: 30, gamma: 2,  delta: 0, epsilon: 0, zeta: 0, active: true },
    { id: 3, name: 'Hal', alpha: 8,  beta: 10, gamma: 8,  delta: 0, epsilon: 0, zeta: 0, active: true },
    { id: 4, name: 'Ivy', alpha: 4,  beta: 60, gamma: 4,  delta: 0, epsilon: 0, zeta: 0, active: true },
    { id: 5, name: 'Jo',  alpha: 10, beta: 90, gamma: 10, delta: 0, epsilon: 0, zeta: 0, active: true },
  ],
};

test.describe('ebb against the mean', () => {
  test('ebb, strays and count use the mean', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed(SEED);
    await page.goto('/');
    await page.getByTestId('nav-worksheet').click();

    await expect(page.getByTestId('person-row-1').getByTestId('concept-ebb')).toHaveText('-224');
    await expect(page.getByTestId('person-row-4').getByTestId('concept-ebb')).toHaveText('-24');
    await expect(page.getByTestId('person-row-5').getByTestId('concept-ebb')).toHaveText('636');

    await expect(page.getByTestId('person-row-1').getByTestId('concept-stray')).toHaveText('yes');
    await expect(page.getByTestId('person-row-4').getByTestId('concept-stray')).toHaveText('no');
    await expect(page.getByTestId('rollup-stray-count')).toHaveText('4');
  });
});
