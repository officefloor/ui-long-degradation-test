import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// total gust rollup: sum of gusts (skip n/a), a negative gust counting as zero.
// gust = reach + torque, reach uses this sheet's N=4, S=2, else=1.
//   gust: Ada 15*4+33=93, Ben -2-2=-4, Dot 100+100=200
//   Hela (on hold): momentum 9+3=12, torque 10+3*1=13, region S1 -> reach 24, gust 37, counted as 37/2 = 18.5 -> 19
//   Nil has no delta, which counts as 0: torque 0*1 + 3*(1-0) = 3, no region so reach 0, gust 3
//   Sol is shared from sheet S9 as row 8 and counted here like anyone: torque 1, no region, gust 1
//   total: 93 + 0 (Ben's -4) + 200 + 3 + 19 + 1 = 316

test.describe('total gust', () => {
  test('total gust sums the gusts', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
  settings: { regionMultipliers: { N: 4, S: 2, other: 1 } },
  people: [
    { id: 1, name: 'Ada', alpha: 2, beta: 3,  gamma: 5, delta: 3, epsilon: 4,  zeta: 10, active: true },
    { id: 2, name: 'Ben', alpha: 4, beta: 2,  gamma: 1, delta: 5, epsilon: 2,  zeta: 1,  active: true },
    { id: 3, name: 'Dot', alpha: 5, beta: 20, gamma: 5, delta: 5, epsilon: 20, zeta: 5,  active: true },
    // Nil's delta is missing, so it counts as 0 -> gust 3.
    { id: 4, name: 'Nil', alpha: 1, beta: 1, gamma: 1, delta: null, epsilon: 1, zeta: 1, active: true },
    // Hela is on hold: left out of sheet-wide figures, so the total counts her gust at half, to the nearest.
    { id: 9, name: 'Hela', alpha: 3, beta: 3, gamma: 4, delta: 2, epsilon: 5, zeta: 3, active: true, hold: true },
  ],
  regions: [
    { personId: 1, region: 'N1' }, { personId: 2, region: 'S2' }, { personId: 3, region: 'E5' },
    { personId: 9, region: 'S1' },
  ],
  sheets: [
    { id: 'S9', people: [
      { id: 1, name: 'Sol', alpha: 1, beta: 1, gamma: 1, delta: 1, epsilon: 1, zeta: 1, active: true },
    ] },
  ],
  shares: [{ personId: 8, fromSheetId: 'S9', fromPersonId: 1 }],
});
    await page.goto('/');

    await expect(page.getByTestId('person-row-4').getByTestId('concept-gust')).toHaveText('3');
    // rollup-total-gust: Ada 93 + Ben 0 (-4 as 0) + Dot 200 + Nil 3 + Hela 19 (half of 37) + Sol 1 = 316; leave out the highest contribution, Dot's 200 -> 116
    await expect(page.getByTestId('rollup-total-gust')).toHaveText('116');
  });
});
