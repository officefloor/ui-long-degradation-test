import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// total gust rollup: sum of gusts (skip n/a), a negative gust counting as zero.
// gust = reach + torque, reach uses N=3, S=2, else=1.
//   gust: Ada 60+33=93 (N at 4), Ben -2-2=-4, Dot 100+100=200, Sol 0+5=5
//   Hela (on hold): momentum 9+3=12, torque 10+3*1=13, region S1 -> reach 24, gust 37, counted as 37/2 = 18.5 -> 19
//   total: 93 + 0 (Ben's -4) + 200 + 5 + 19 = 317

// This sheet multiplies region N by 4 (S 2 and other 1 as usual): Ada's reach is 15*4 = 60, gust 60+33 = 93.
// Sol is shared from sheet S9 as row 8: counted here like anyone. Sol is in no region: reach 0, torque 5, gust 5.
// The anchor is 2026-03-01. Dot's beta becomes 21 from 2026-04-01: a change dated after the anchor does not count yet.
test.describe('total gust', () => {
  test('total gust sums the gusts', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
  anchor: '2026-03-01',
  settings: { regionMultipliers: { N: 4 } },
  people: [
    { id: 1, name: 'Ada', alpha: 2, beta: 3,  gamma: 5, delta: 3, epsilon: 4,  zeta: 10, active: true },
    { id: 2, name: 'Ben', alpha: 4, beta: 2,  gamma: 1, delta: 5, epsilon: 2,  zeta: 1,  active: true },
    { id: 3, name: 'Dot', alpha: 5, beta: 20, gamma: 5, delta: 5, epsilon: 20, zeta: 5,  active: true },
    // Nil's delta is missing -> torque n/a -> gust n/a, so Nil is skipped.
    { id: 4, name: 'Nil', alpha: 1, beta: 1, gamma: 1, delta: null, epsilon: 1, zeta: 1, active: true },
    // Hela is on hold: left out of sheet-wide figures, so the total counts her gust at half, to the nearest.
    { id: 9, name: 'Hela', alpha: 3, beta: 3, gamma: 4, delta: 2, epsilon: 5, zeta: 3, active: true, hold: true },
  ],
  regions: [
    { personId: 1, region: 'N1' }, { personId: 2, region: 'S2' }, { personId: 3, region: 'E5' },
    { personId: 9, region: 'S1' },
  ],
  sheets: [{ id: 'S9', people: [{ id: 1, name: 'Sol', alpha: 2, beta: 5, gamma: 2, delta: 1, epsilon: 5, zeta: 1, active: true }] }],
  shares: [{ personId: 8, fromSheetId: 'S9', fromPersonId: 1 }],
  history: [{ personId: 3, field: 'beta', value: 21, from: '2026-04-01' }],
});
    await page.goto('/');

    await expect(page.getByTestId('person-row-4').getByTestId('concept-gust')).toHaveText('n/a');
    await expect(page.getByTestId('rollup-total-gust')).toHaveText('317');
  });
});
