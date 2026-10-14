import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// band from adjusted: <0 E, 0..49 D, 50..149 C, 150..299 B, >=300 A.
// With no patrons/allies/score, adjusted = momentum.

test.describe('band', () => {
  test('band classifies adjusted into five bands', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
  people: [
    { id: 1, name: 'Ed', alpha: 3,  beta: 1,  gamma: 0,  active: true }, // momentum -6  -> E
    { id: 2, name: 'Di', alpha: 5,  beta: 6,  gamma: 5,  active: true }, // momentum 30  -> D
    { id: 3, name: 'Cy', alpha: 5,  beta: 20, gamma: 5,  active: true }, // momentum 100 -> C
    { id: 4, name: 'Bo', alpha: 10, beta: 20, gamma: 10, active: true }, // momentum 200 -> B
    { id: 5, name: 'An', alpha: 20, beta: 20, gamma: 20, active: true }, // momentum 400 -> A
  ],
});
    await page.goto('/');

    await expect(page.getByTestId('person-row-1').getByTestId('concept-band')).toHaveText('E');
    await expect(page.getByTestId('person-row-2').getByTestId('concept-band')).toHaveText('D');
    await expect(page.getByTestId('person-row-3').getByTestId('concept-band')).toHaveText('C');
    await expect(page.getByTestId('person-row-4').getByTestId('concept-band')).toHaveText('B');
    await expect(page.getByTestId('person-row-5').getByTestId('concept-band')).toHaveText('A');
  });
});
