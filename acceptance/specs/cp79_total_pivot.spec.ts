import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// total pivot rollup: sum of pivots (skip n/a). 33 + -4 + 400 = 429.
// Hela is on hold: left out of sheet-wide figures, counted at half in totals.
//   Hela torque -7, verge B 2 -> pivot -14, counts -14/2 = -7 ; total 429 - 7 = 422

test.describe('total pivot', () => {
  test('total pivot sums the pivots', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
  people: [
    { id: 1, name: 'Ada', alpha: 2, beta: 3,  gamma: 5, delta: 3, epsilon: 4,  zeta: 10, kind: 'A' },
    { id: 2, name: 'Ben', alpha: 4, beta: 2,  gamma: 1, delta: 5, epsilon: 2,  zeta: 1,  kind: 'B' },
    { id: 3, name: 'Dot', alpha: 5, beta: 20, gamma: 5, delta: 5, epsilon: 20, zeta: 5,  kind: 'C' },
    // Nil's delta is missing -> torque n/a -> pivot n/a, so Nil is skipped (adds nothing).
    { id: 4, name: 'Nil', alpha: 1, beta: 1, gamma: 1, delta: null, epsilon: 1, zeta: 1, kind: 'A' },
    { id: 9, name: 'Hela', alpha: 1, beta: 1, gamma: 1, delta: 1, epsilon: -7, zeta: 1, kind: 'B', hold: true },
  ],
});
    await page.goto('/');

    await expect(page.getByTestId('person-row-4').getByTestId('concept-pivot')).toHaveText('n/a');
    await expect(page.getByTestId('rollup-total-pivot')).toHaveText('422');
  });
});
