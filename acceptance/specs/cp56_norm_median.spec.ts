import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// MUTATIVE (mutates cp53, cp54, cp55): norm now subtracts the MEDIAN of scaled, not the mean (for an
// even count the median is the lower of the two middle values). That changes every norm, flips
// outliers and the count.
//   scaled sorted: 40, 60, 80, 240, 900 -> median 80
//   norm: -40, -20, 0, 160, 820 ; outliers (|norm|>100): no,no,no,yes,yes -> count 2
// Updated cp53/cp54/cp55 ship under acceptance/specs/cp56/.
const SEED = {
  people: [
    { id: 1, name: 'Fay', alpha: 5,  beta: 8,  gamma: 5,  active: true }, // scaled 40
    { id: 2, name: 'Gus', alpha: 2,  beta: 30, gamma: 2,  active: true }, // scaled 60
    { id: 3, name: 'Hal', alpha: 8,  beta: 10, gamma: 8,  active: true }, // scaled 80
    { id: 4, name: 'Ivy', alpha: 4,  beta: 30, gamma: 4,  active: true }, // scaled 240
    { id: 5, name: 'Jo',  alpha: 10, beta: 30, gamma: 10, active: true }, // scaled 900
  ],
};

test.describe('norm against the median', () => {
  test('norm, outliers and count use the median', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed(SEED);
    await page.goto('/');
    await page.getByTestId('nav-worksheet').click();

    await expect(page.getByTestId('person-row-1').getByTestId('concept-norm')).toHaveText('-40');
    await expect(page.getByTestId('person-row-2').getByTestId('concept-norm')).toHaveText('-20');
    await expect(page.getByTestId('person-row-3').getByTestId('concept-norm')).toHaveText('0');
    await expect(page.getByTestId('person-row-4').getByTestId('concept-norm')).toHaveText('160');
    await expect(page.getByTestId('person-row-5').getByTestId('concept-norm')).toHaveText('820');

    await expect(page.getByTestId('person-row-4').getByTestId('concept-outlier')).toHaveText('yes');
    await expect(page.getByTestId('person-row-1').getByTestId('concept-outlier')).toHaveText('no');
    await expect(page.getByTestId('rollup-outlier-count')).toHaveText('2');
  });
});
