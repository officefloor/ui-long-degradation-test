import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// In every total across the whole sheet a negative value counts as zero. A person on hold first
// counts at half (rounded to the nearest, a half rounding up), and that half counts as zero when it
// is negative. Counts and the
// person's own figures keep negative values as they are.
//
// momentum = thrust + 3*drift, torque = force + 3*sway, blend = momentum + torque,
// load = momentum * weight (LOW 1, MID 3, HIGH 5), pivot = torque * verge (A 1, B 2, C 4),
// reach = momentum * region multiplier (N 3, S 2, other 1), gust = reach + torque.
//   Ann  momentum 100, torque 10, blend 110, LOW load 100, A pivot 10, N1 reach 300, gust 310
//   Bob  momentum 6+3*(-6) = -12, torque 2+3*(-1) = -1, blend -13, MID load -36, B pivot -2,
//        S1 reach -24, gust -25, effective -12 -> every total counts Bob as 0
//   Cyd  momentum 20, torque 3, blend 23, HIGH load 100, C pivot 12, X1 reach 20, gust 23
//   Hela (on hold) momentum 15, torque 2+3*(-8) = -22, blend -7, MID load 45, A pivot -22,
//        N2 reach 45, gust 23, effective 15
//        at half: load 22.5 -> 23, effective 7.5 -> 8, gust 11.5 -> 12, blend -7 -> -3 -> 0,
//        pivot -11 -> 0
//
// with HIGH at 6 Cyd's load is 120; Sol adds load 10, effective 10, blend 11, pivot 1, gust 1
// total load      100 + 0 + 120 + 10 + 23 = 253   (not 100-36+120+10+23 = 217)
// total effective 100 + 0 + 20 + 10 + 8   = 138   (not 126)
// total blend     110 + 0 + 23 + 11 + 0   = 144   (not 110-13+23+11-4 = 127)
// total pivot     10 + 0 + 12 + 1 + 0     = 23    (not 10-2+12+1-11 = 10)
// total gust      310 + 0 + 23 + 1 + 12   = 346   (not 321)

// This sheet weighs HIGH at 6 (LOW 1 and MID 3 as usual): Cyd's load is 20*6 = 120.
// Sol is shared from sheet S9 as row 8: counted here like anyone. Sol: momentum 10, torque 1, blend 11, LOW load 10, A pivot 1, in no region: reach 0,
// gust 1, effective 10.
// The anchor is 2026-03-01. Cyd's beta becomes 6 from 2026-04-01: a change dated after the anchor does not count yet.
test.describe('negatives as zero', () => {
  test('a negative value counts as zero in every sheet-wide total', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      anchor: '2026-03-01',
      settings: { gradeWeights: { HIGH: 6 } },
      people: [
        { id: 1, name: 'Ann',  alpha: 5, beta: 20, gamma: 5, delta: 2, epsilon: 5, zeta: 2,  grade: 'LOW',  kind: 'A', active: true },
        { id: 2, name: 'Bob',  alpha: 6, beta: 1,  gamma: 0, delta: 1, epsilon: 2, zeta: 0,  grade: 'MID',  kind: 'B', active: true },
        { id: 3, name: 'Cyd',  alpha: 4, beta: 5,  gamma: 4, delta: 1, epsilon: 3, zeta: 1,  grade: 'HIGH', kind: 'C', active: true },
        { id: 9, name: 'Hela', alpha: 3, beta: 5,  gamma: 3, delta: 1, epsilon: 2, zeta: -7, grade: 'MID',  kind: 'A', active: true, hold: true },
      ],
      regions: [
        { personId: 1, region: 'N1' }, { personId: 2, region: 'S1' },
        { personId: 3, region: 'X1' }, { personId: 9, region: 'N2' },
      ],
      sheets: [{ id: 'S9', people: [{ id: 1, name: 'Sol', alpha: 2, beta: 5, gamma: 2, delta: 1, epsilon: 1, zeta: 1, grade: 'LOW', kind: 'A', active: true }] }],
      shares: [{ personId: 8, fromSheetId: 'S9', fromPersonId: 1 }],
      history: [{ personId: 3, field: 'beta', value: 6, from: '2026-04-01' }],
    });
    await page.goto('/');

    // the person's own figures stay negative
    await expect(page.getByTestId('person-row-2').getByTestId('concept-load')).toHaveText('-36');
    await expect(page.getByTestId('person-row-2').getByTestId('concept-gust')).toHaveText('-25');

    await expect(page.getByTestId('rollup-total-load')).toHaveText('253');
    await expect(page.getByTestId('rollup-total-effective')).toHaveText('138');
    await expect(page.getByTestId('rollup-total-blend')).toHaveText('144');
    await expect(page.getByTestId('rollup-total-pivot')).toHaveText('23');
    await expect(page.getByTestId('rollup-total-gust')).toHaveText('346');
    // a count is not a total: Ann, Bob, Cyd and Sol are active (Hela is on hold)
    await expect(page.getByTestId('rollup-active-count')).toHaveText('4');
  });
});
