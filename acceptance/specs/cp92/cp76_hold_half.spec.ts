import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// In every sheet-wide total a person on hold counts at half their value, rounded down to the whole
// number below (so -7 counts as -4, not -3). Counts, ranks, percentiles, the leader, top names and
// the median still leave them out.
// In the first test the sheet has its own grade weights (LOW 2, MID 4, HIGH 5).
//
//   Ann  momentum 100, LOW load 200, active, effective 100, torque 10 blend 110, adjusted 100 -> C scaled 200, FINAL
//   Bob  momentum 40,  MID load 160, active, effective 40,  torque 3  blend 43,  adjusted 40  -> D scaled 40,  DRAFT
//   Cyd  momentum 10,  LOW load 20,  not active, effective 10/2 = 5, torque 1 blend 11,
//        adjusted 5 -> D scaled 5, FINAL
//   Hela (on hold) momentum 15, MID load 60, active, effective 15, torque 2+3*(-7-1) = -22,
//        blend 15-22 = -7, adjusted 15 -> D scaled 15, FINAL
// Hela at half: load 60 -> 30, effective 15 -> 7, scaled 15 -> 7, blend -7 -> -4, and a negative
// value counts as zero in a sheet-wide total, so her blend counts as 0

test.describe('hold at half', () => {
  test('totals count a held person at half, rounded down', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      people: [
        { id: 1, name: 'Ann',  alpha: 5, beta: 20, gamma: 5, delta: 2, epsilon: 5, zeta: 2,  grade: 'LOW', active: true,  state: 'FINAL' },
        { id: 2, name: 'Bob',  alpha: 4, beta: 10, gamma: 4, delta: 1, epsilon: 3, zeta: 1,  grade: 'MID', active: true,  state: 'DRAFT' },
        { id: 3, name: 'Cyd',  alpha: 2, beta: 5,  gamma: 2, delta: 1, epsilon: 1, zeta: 1,  grade: 'LOW', active: false, state: 'FINAL' },
        { id: 9, name: 'Hela', alpha: 3, beta: 5,  gamma: 3, delta: 1, epsilon: 2, zeta: -7, grade: 'MID', active: true,  state: 'FINAL', hold: true },
      ],
      // this sheet has its own grade weights
      settings: { gradeWeights: { LOW: 2, MID: 4, HIGH: 5 } },
    });
    await page.goto('/');

    await expect(page.getByTestId('rollup-total-load')).toHaveText('410');      // 200+160+20 + 30
    await expect(page.getByTestId('rollup-total-effective')).toHaveText('152'); // 100+40+5 + 7
    await expect(page.getByTestId('rollup-final-total')).toHaveText('212');     // 200+5 + 7
    await expect(page.getByTestId('rollup-total-blend')).toHaveText('164');     // 110+43+11 + 0
  });

  test('counts and ranks still leave a held person out', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      people: [
        { id: 1, name: 'Ann',  alpha: 5, beta: 20, gamma: 5, delta: 2, epsilon: 5, zeta: 2,  grade: 'LOW', active: true,  state: 'FINAL' },
        { id: 2, name: 'Bob',  alpha: 4, beta: 10, gamma: 4, delta: 1, epsilon: 3, zeta: 1,  grade: 'MID', active: true,  state: 'DRAFT' },
        { id: 3, name: 'Cyd',  alpha: 2, beta: 5,  gamma: 2, delta: 1, epsilon: 1, zeta: 1,  grade: 'LOW', active: false, state: 'FINAL' },
        { id: 9, name: 'Hela', alpha: 3, beta: 5,  gamma: 3, delta: 1, epsilon: 2, zeta: -7, grade: 'MID', active: true,  state: 'FINAL', hold: true },
      ],
    });
    await page.goto('/');

    await expect(page.getByTestId('rollup-active-count')).toHaveText('2'); // Ann, Bob (not Hela)
    await expect(page.getByTestId('band-count-D')).toHaveText('2');        // Bob, Cyd (not Hela)
    // ranks among Ann 100, Bob 40, Cyd 10 ; Hela (15) has none
    await expect(page.getByTestId('person-row-2').getByTestId('concept-rank')).toHaveText('2');
    await expect(page.getByTestId('person-row-3').getByTestId('concept-rank')).toHaveText('3');
    await expect(page.getByTestId('person-row-9').getByTestId('concept-rank')).toHaveText('n/a');
    await expect(page.getByTestId('person-row-9').getByTestId('concept-percentile')).toHaveText('n/a');
  });
});
