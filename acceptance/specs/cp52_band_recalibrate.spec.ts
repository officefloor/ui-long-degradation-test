import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// Band boundaries on adjusted: below 0 is E, 0 to 99 is D, 100 to 249 is C, 250 to 499 is B, and
// 500 or more is A. Scaled is adjusted times the band's multiplier (E 0, D 1, C 2, B 3), so an
// adjusted of 200 is band C (scaled 400) and an adjusted of 400 is band B (scaled 1200).

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
