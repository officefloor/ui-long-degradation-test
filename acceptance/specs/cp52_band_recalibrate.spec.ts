import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

//   <0 E, 0..99 D, 100..249 C, 250..499 B, >=500 A.
// That reclassifies people (adjusted 200 was B, now C; 400 was A, now B) and rescales. Multipliers

test.describe('band recalibrated', () => {
  test('new boundaries reclassify and rescale', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
  people: [
    { id: 1, name: 'Ed', alpha: 3,  beta: 1,  gamma: 0,  active: true }, // -6  -> E; scaled 0
    { id: 2, name: 'Di', alpha: 5,  beta: 6,  gamma: 5,  active: true }, // 30  -> D; scaled 30
    { id: 3, name: 'Cy', alpha: 5,  beta: 20, gamma: 5,  active: true }, // 100 -> C; scaled 200
    { id: 4, name: 'Bo', alpha: 10, beta: 20, gamma: 10, active: true }, // 200 -> C; scaled 400
    { id: 5, name: 'An', alpha: 20, beta: 20, gamma: 20, active: true }, // 400 -> B; scaled 1200
  ],
});
    await page.goto('/');

    await expect(page.getByTestId('person-row-1').getByTestId('concept-band')).toHaveText('E');
    await expect(page.getByTestId('person-row-2').getByTestId('concept-band')).toHaveText('D');
    await expect(page.getByTestId('person-row-3').getByTestId('concept-band')).toHaveText('C');
    await expect(page.getByTestId('person-row-4').getByTestId('concept-band')).toHaveText('C');
    await expect(page.getByTestId('person-row-5').getByTestId('concept-band')).toHaveText('B');

    await expect(page.getByTestId('person-row-1').getByTestId('concept-scaled')).toHaveText('0');
    await expect(page.getByTestId('person-row-2').getByTestId('concept-scaled')).toHaveText('30');
    await expect(page.getByTestId('person-row-3').getByTestId('concept-scaled')).toHaveText('200');
    await expect(page.getByTestId('person-row-4').getByTestId('concept-scaled')).toHaveText('400');
    await expect(page.getByTestId('person-row-5').getByTestId('concept-scaled')).toHaveText('1200');
  });
});
