import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// MUTATIVE REVERSAL (mutates cp53, cp54, cp55, cp56): norm goes back to scaled minus the floored
// MEAN of scaled (undoing the median change of cp56). Outliers and the count follow.
//   scaled 40,60,80,240,900 ; mean floor = 1320/5 = 264
//   norm: -224,-204,-184,-24,636 ; outliers (|norm|>100): yes,yes,yes,no,yes -> count 4
// Updated cp53/cp54/cp55/cp56 ship under acceptance/specs/cp248/.
const SEED = {
  people: [
    { id: 1, name: 'Fay', alpha: 5,  beta: 8,  gamma: 5,  active: true }, // scaled 40
    { id: 2, name: 'Gus', alpha: 2,  beta: 30, gamma: 2,  active: true }, // scaled 60
    { id: 3, name: 'Hal', alpha: 8,  beta: 10, gamma: 8,  active: true }, // scaled 80
    { id: 4, name: 'Ivy', alpha: 4,  beta: 30, gamma: 4,  active: true }, // scaled 240
    { id: 5, name: 'Jo',  alpha: 10, beta: 30, gamma: 10, active: true }, // scaled 900
  ],
};

test.describe('norm reverted to mean', () => {
  test('norm, outliers and count use the mean again', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed(SEED);
    await page.goto('/');
    await page.getByTestId('nav-worksheet').click();

    await expect(page.getByTestId('person-row-1').getByTestId('concept-norm')).toHaveText('-224');
    await expect(page.getByTestId('person-row-2').getByTestId('concept-norm')).toHaveText('-204');
    await expect(page.getByTestId('person-row-3').getByTestId('concept-norm')).toHaveText('-184');
    await expect(page.getByTestId('person-row-4').getByTestId('concept-norm')).toHaveText('-24');
    await expect(page.getByTestId('person-row-5').getByTestId('concept-norm')).toHaveText('636');

    await expect(page.getByTestId('person-row-4').getByTestId('concept-outlier')).toHaveText('no');
    await expect(page.getByTestId('person-row-1').getByTestId('concept-outlier')).toHaveText('yes');
    await expect(page.getByTestId('rollup-outlier-count')).toHaveText('4');
  });
});
