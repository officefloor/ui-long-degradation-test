import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// total pivot rollup: sum of pivots (skip n/a), a negative pivot counting as zero.
//   Ada 33, Ben -4 -> 0, Dot 400
// Hela is on hold: left out of sheet-wide figures, counted at half in totals.
//   Hela torque 7, verge B 2 -> pivot 14, counts 14/2 = 7
// Nil has no delta, which counts as 0: force 0, sway 1, torque 3, verge A 1 -> pivot 3
// total 33 + 0 + 400 + 3 + 7 = 443
// Sol is shared from sheet S9 as row 8 and counted here like anyone: torque 3, verge A 1 -> pivot 3.

test.describe('total pivot', () => {
  test('total pivot sums the pivots', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
  people: [
    { id: 1, name: 'Ada', alpha: 2, beta: 3,  gamma: 5, delta: 3, epsilon: 4,  zeta: 10, kind: 'A' },
    { id: 2, name: 'Ben', alpha: 4, beta: 2,  gamma: 1, delta: 5, epsilon: 2,  zeta: 1,  kind: 'B' },
    { id: 3, name: 'Dot', alpha: 5, beta: 20, gamma: 5, delta: 5, epsilon: 20, zeta: 5,  kind: 'C' },
    // Nil's delta is missing, so it counts as 0 -> pivot 3.
    { id: 4, name: 'Nil', alpha: 1, beta: 1, gamma: 1, delta: null, epsilon: 1, zeta: 1, kind: 'A' },
    { id: 9, name: 'Hela', alpha: 1, beta: 1, gamma: 1, delta: 1, epsilon: 7, zeta: 1, kind: 'B', hold: true },
  ],
  sheets: [
    { id: 'S9', people: [
      { id: 1, name: 'Sol', alpha: 1, beta: 1, gamma: 1, delta: 1, epsilon: 3, zeta: 1, kind: 'A' },
    ] },
  ],
  shares: [{ personId: 8, fromSheetId: 'S9', fromPersonId: 1 }],
});
    await page.goto('/');

    await expect(page.getByTestId('person-row-4').getByTestId('concept-pivot')).toHaveText('3');
    // rollup-total-pivot: Ada 33 + Ben 0 (-4 as 0) + Dot 400 + Nil 3 + Hela 7 (half of 14) + Sol 3 = 446; leave out the highest contribution, Dot's 400 -> 46
    await expect(page.getByTestId('rollup-total-pivot')).toHaveText('46');
  });
});
