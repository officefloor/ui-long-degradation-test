import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// In every total across the whole sheet a negative value counts as zero. A person on hold first
// counts at half (rounded down), and that half counts as zero when it is negative. Counts and the
// person's own figures keep negative values as they are.
//
// momentum = thrust + 3*drift, torque = force + 3*sway, blend = momentum + torque,
// This sheet has its own grade weights and region multipliers:
// load = momentum * weight (LOW 2, MID 3, HIGH 4), pivot = torque * verge (A 1, B 2, C 4),
// reach = momentum * region multiplier (N 4, S 5, other 2), gust = reach + torque.
//   Ann  momentum 100, torque 10, blend 110, LOW load 200, A pivot 10, N1 reach 400, gust 410
//   Bob  momentum 6+3*(-6) = -12, torque 2+3*(-1) = -1, blend -13, MID load -36, B pivot -2,
//        S1 reach -60, gust -61, effective -12 -> every total counts Bob as 0
//   Cyd  momentum 20, torque 3, blend 23, HIGH load 80, C pivot 12, X1 reach 40, gust 43
//   Hela (on hold) momentum 15, torque 2+3*(-8) = -22, blend -7, MID load 45, A pivot -22,
//        N2 reach 60, gust 38, effective 15
//        at half: load 22, effective 7, gust 19, blend -7 -> -4 -> 0, pivot -11 -> 0
//
// total load      200 + 0 + 80 + 22  = 302   (not 200-36+80+22 = 266)
// total effective 100 + 0 + 20 + 7   = 127   (not 115)
// total blend     110 + 0 + 23 + 0   = 133   (not 110-13+23-4 = 116)
// total pivot     10 + 0 + 12 + 0    = 22    (not 10-2+12-11 = 9)
// total gust      410 + 0 + 43 + 19  = 472   (not 411)

test.describe('negatives as zero', () => {
  test('a negative value counts as zero in every sheet-wide total', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
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
      // this sheet has its own region multipliers and grade weights
      settings: { regionMultipliers: { N: 4, S: 5, other: 2 }, gradeWeights: { LOW: 2, MID: 3, HIGH: 4 } },
    });
    await page.goto('/');

    // the person's own figures stay negative
    await expect(page.getByTestId('person-row-2').getByTestId('concept-load')).toHaveText('-36');
    await expect(page.getByTestId('person-row-2').getByTestId('concept-gust')).toHaveText('-61');

    await expect(page.getByTestId('rollup-total-load')).toHaveText('302');
    await expect(page.getByTestId('rollup-total-effective')).toHaveText('127');
    await expect(page.getByTestId('rollup-total-blend')).toHaveText('133');
    await expect(page.getByTestId('rollup-total-pivot')).toHaveText('22');
    await expect(page.getByTestId('rollup-total-gust')).toHaveText('472');
    // a count is not a total: Ann, Bob and Cyd are active (Hela is on hold)
    await expect(page.getByTestId('rollup-active-count')).toHaveText('3');
  });
});
