import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// top flow is still Dot.
//   flow: Ada 81+180=261 (vector (-3+200)/2 = 98.5 -> 99), Ben -4-4=-8, Dot 1000+997=1997
// Hela is on hold: left out of sheet-wide figures, counted at half in totals.
//   Hela momentum 1, torque 7, blend 8 (L1, lift 8), pivot 7*2 = 14 -> yield 22 ; no patrons or
//   follows, so charge 22 and flow 22 + 22 = 44, counted at 44/2 = 22
//   grand 261+0+1997+22 = 2280 (Ben's -8 counts as zero in a sheet-wide total)
// Sol is shared from sheet S9 as row 8 and counted here like anyone: momentum 1, torque 3, blend 4,
// pivot 6 -> yield 10, charge 10, flow 20.
// A change dated after the anchor does not count yet: Ada's beta 6 from 2026-04-01.

test.describe('flow drops tide', () => {
  test('flow = yield + charge; grand follows', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
  anchor: '2026-03-01',
  people: [
    { id: 1, name: 'Ada', alpha: 2, beta: 3,  gamma: 5, delta: 3, epsilon: 4,  zeta: 10, kind: 'A', active: true },
    { id: 2, name: 'Ben', alpha: 4, beta: 2,  gamma: 1, delta: 5, epsilon: 2,  zeta: 1,  kind: 'B', active: true },
    { id: 3, name: 'Dot', alpha: 5, beta: 20, gamma: 5, delta: 5, epsilon: 20, zeta: 5,  kind: 'C', active: true },
    { id: 9, name: 'Hela', alpha: 1, beta: 1, gamma: 1, delta: 1, epsilon: 7, zeta: 1, kind: 'B', active: true, hold: true },
  ],
  patrons: [
    { personId: 1, patronId: 2 }, { personId: 1, patronId: 3 },
    { personId: 3, patronId: 2 },
  ],
  follows: [
    { from: 1, to: 2 }, { from: 1, to: 3 },
    { from: 3, to: 2 },
  ],
  sheets: [
    { id: 'S9', people: [
      { id: 1, name: 'Sol', alpha: 1, beta: 1, gamma: 1, delta: 1, epsilon: 3, zeta: 1, kind: 'B', active: true },
    ] },
  ],
  shares: [{ personId: 8, fromSheetId: 'S9', fromPersonId: 1 }],
  history: [{ personId: 1, field: 'beta', value: 6, from: '2026-04-01' }],
});
    await page.goto('/');

    await expect(page.getByTestId('person-row-1').getByTestId('concept-flow')).toHaveText('261');
    await expect(page.getByTestId('person-row-2').getByTestId('concept-flow')).toHaveText('-8');
    await expect(page.getByTestId('person-row-3').getByTestId('concept-flow')).toHaveText('1997');

    // rollup-grand-flow: Ada 261 + Ben 0 (-8 as 0) + Dot 1997 + Hela 22 (half of 44) + Sol 20 = 2300; leave out the highest contribution, Dot's 1997 -> 303
    await expect(page.getByTestId('rollup-grand-flow')).toHaveText('303');
  });
});
