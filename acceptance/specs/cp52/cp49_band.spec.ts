import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../../support/seed';

// UPDATED PRIOR shipped by cp52 (mutates cp49). Recalibrated bands:
//   <0 E, 0..99 D, 100..249 C, 250..499 B, >=500 A.
const SEED = {
  people: [
    { id: 1, name: 'Ed', alpha: 3,  beta: 1,  gamma: 0,  active: true }, // -6  -> E
    { id: 2, name: 'Di', alpha: 5,  beta: 6,  gamma: 5,  active: true }, // 30  -> D
    { id: 3, name: 'Cy', alpha: 5,  beta: 20, gamma: 5,  active: true }, // 100 -> C
    { id: 4, name: 'Bo', alpha: 10, beta: 20, gamma: 10, active: true }, // 200 -> C
    { id: 5, name: 'An', alpha: 20, beta: 20, gamma: 20, active: true }, // 400 -> B
  ],
};

test.describe('band', () => {
  test('band classifies adjusted into five bands', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed(SEED);
    await page.goto('/');
    await page.getByTestId('nav-worksheet').click();

    await expect(page.getByTestId('person-row-1').getByTestId('concept-band')).toHaveText('E');
    await expect(page.getByTestId('person-row-2').getByTestId('concept-band')).toHaveText('D');
    await expect(page.getByTestId('person-row-3').getByTestId('concept-band')).toHaveText('C');
    await expect(page.getByTestId('person-row-4').getByTestId('concept-band')).toHaveText('C');
    await expect(page.getByTestId('person-row-5').getByTestId('concept-band')).toHaveText('B');
  });
});
