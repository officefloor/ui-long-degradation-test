import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// total gust rollup: sum of gusts (skip n/a), a negative gust counting as zero.
// gust = reach + torque, reach uses this sheet's own N=4, S=1, else=1.
//   gust: Ada 15*4+33=93, Ben -1-2=-3, Dot 100+100=200
//   Hela (on hold): momentum 9+3=12, torque 10+3*1=13, region S1 -> reach 12, gust 25, counted as 25/2 = 12.5 -> 13
//   Nil has no delta, which counts as 0: torque 0*1 + 3*(1-0) = 3, no region so reach 0, gust 3
//   Sol (shared): no region so reach 0, torque 1*5 + 3*(1-1) = 5, gust 5
//   total: 93 + 0 (Ben's -3) + 200 + 3 + 13 + 5 = 314
//   as of 2026-01-15 Dot's beta is 10: momentum 50, gust 50+100 = 150, total 314 - 50 = 264

test.describe('total gust', () => {
  test('total gust sums the gusts', { tag: '@functionality' }, async ({ page }) => {
    // the sheet's own region multipliers (N 4, S 1, other 1) set the reach
    // Sol is shared from sheet S9: counted here like anyone
    // a change dated after the anchor does not count yet (Dot's beta 40 from 2026-04-01); Dot's beta was
    // 10 until it became 20 on 2026-02-01
    await resetAndSeed({
  anchor: '2026-03-01',
  settings: { regionMultipliers: { N: 4, S: 1, other: 1 } },
  sheets: [
    { id: 'S9', people: [{ id: 1, name: 'Sol', alpha: 1, beta: 1, gamma: 1, delta: 1, epsilon: 5, zeta: 1, active: true }] },
  ],
  shares: [{ personId: 8, fromSheetId: 'S9', fromPersonId: 1 }],
  history: [
    { personId: 3, field: 'beta', value: 20, from: '2026-02-01' },
    { personId: 3, field: 'beta', value: 40, from: '2026-04-01' },
  ],
  people: [
    { id: 1, name: 'Ada', alpha: 2, beta: 3,  gamma: 5, delta: 3, epsilon: 4,  zeta: 10, active: true },
    { id: 2, name: 'Ben', alpha: 4, beta: 2,  gamma: 1, delta: 5, epsilon: 2,  zeta: 1,  active: true },
    { id: 3, name: 'Dot', alpha: 5, beta: 10, gamma: 5, delta: 5, epsilon: 20, zeta: 5,  active: true },
    // Nil's delta is missing, so it counts as 0 -> gust 3.
    { id: 4, name: 'Nil', alpha: 1, beta: 1, gamma: 1, delta: null, epsilon: 1, zeta: 1, active: true },
    // Hela is on hold: left out of sheet-wide figures, so the total counts her gust at half, to the nearest.
    { id: 9, name: 'Hela', alpha: 3, beta: 3, gamma: 4, delta: 2, epsilon: 5, zeta: 3, active: true, hold: true },
  ],
  regions: [
    { personId: 1, region: 'N1' }, { personId: 2, region: 'S2' }, { personId: 3, region: 'E5' },
    { personId: 9, region: 'S1' },
  ],
});
    await page.goto('/');

    await expect(page.getByTestId('person-row-4').getByTestId('concept-gust')).toHaveText('3');
    await expect(page.getByTestId('rollup-total-gust')).toHaveText('314');

    await page.getByTestId('sheet-as-of').fill('2026-01-15');
    await page.getByTestId('sheet-as-of-apply').click();
    await expect(page.getByTestId('rollup-total-gust')).toHaveText('264');
  });
});
