import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// In every sheet-wide total a person on hold counts at half their value, rounded to the nearest whole
// number with a half rounding up (so 45 counts as 23 and -7 as -3, which then counts as zero, as
// every negative value does in a sheet-wide total). Counts, ranks, percentiles, the leader, top names
// and the median still leave them out.
//
//   Ann  momentum 100, LOW load 100, active, effective 100, torque 10 blend 110, adjusted 100 -> C scaled 200, FINAL
//   Bob  momentum 40,  MID load 120, active, effective 40,  torque 3  blend 43,  adjusted 40  -> D scaled 40,  DRAFT
//   Cyd  momentum 10,  LOW load 10,  not active, effective 10/2 = 5, torque 1 blend 11,
//        adjusted 5 -> D scaled 5, FINAL
//   Hela (on hold) momentum 15, MID load 45, active, effective 15, torque 2+3*(-7-1) = -22,
//        blend 15-22 = -7, adjusted 15 -> D scaled 15, FINAL
// Hela at half: load 45 -> 23, effective 15 -> 8, scaled 15 -> 8, blend -7 -> -3 -> 0
// Sol is shared from sheet S9 as row 8 and counted here like anyone:
//   Sol  momentum 10,  LOW load 10,  active, effective 10,  torque 1  blend 11,  adjusted 10  -> D scaled 10,  FINAL here

test.describe('hold at half', () => {
  test('totals count a held person at half, to the nearest', { tag: '@functionality' }, async ({ page }) => {
    // This sheet weighs LOW 1, MID 4, HIGH 5: Bob's load 40*4 = 160, Hela's 15*4 = 60 -> half 30.
    // A change dated after the anchor does not count yet: Bob's beta 20 from 2026-04-01.
    await resetAndSeed({
      anchor: '2026-03-01',
      settings: { gradeWeights: { LOW: 1, MID: 4, HIGH: 5 } },
      people: [
        { id: 1, name: 'Ann',  alpha: 5, beta: 20, gamma: 5, delta: 2, epsilon: 5, zeta: 2,  grade: 'LOW', active: true,  state: 'FINAL' },
        { id: 2, name: 'Bob',  alpha: 4, beta: 10, gamma: 4, delta: 1, epsilon: 3, zeta: 1,  grade: 'MID', active: true,  state: 'DRAFT' },
        { id: 3, name: 'Cyd',  alpha: 2, beta: 5,  gamma: 2, delta: 1, epsilon: 1, zeta: 1,  grade: 'LOW', active: false, state: 'FINAL' },
        { id: 9, name: 'Hela', alpha: 3, beta: 5,  gamma: 3, delta: 1, epsilon: 2, zeta: -7, grade: 'MID', active: true,  state: 'FINAL', hold: true },
      ],
      sheets: [
        { id: 'S9', people: [
          { id: 1, name: 'Sol', alpha: 2, beta: 5, gamma: 2, delta: 1, epsilon: 1, zeta: 1, grade: 'LOW', active: true, state: 'FINAL' },
        ] },
      ],
      shares: [{ personId: 8, fromSheetId: 'S9', fromPersonId: 1, state: 'FINAL' }],
      history: [{ personId: 2, field: 'beta', value: 20, from: '2026-04-01' }],
    });
    await page.goto('/');

    // rollup-total-load: Ann 100 + Bob 160 + Cyd 10 + Hela 30 (half of 60) + Sol 10 = 310; leave out the highest contribution, Bob's 160 -> 150
    await expect(page.getByTestId('rollup-total-load')).toHaveText('140');
    // rollup-total-effective: Ann 100 + Bob 40 + Cyd 5 + Hela 8 (half of 15) + Sol 10 = 163; leave out the highest contribution, Ann's 100 -> 63
    await expect(page.getByTestId('rollup-total-effective')).toHaveText('58');
    // rollup-final-total: Ann 200 + Cyd 5 + Hela 8 (half of 15) + Sol 10 = 223; leave out the highest contribution, Ann's 200 -> 23
    await expect(page.getByTestId('rollup-final-total')).toHaveText('18');
    // rollup-total-blend: Ann 110 + Bob 43 + Cyd 11 + Hela 0 (half of -7 = -3, as 0) + Sol 11 = 175; leave out the highest contribution, Ann's 110 -> 65
    await expect(page.getByTestId('rollup-total-blend')).toHaveText('65');
  });

  test('counts and ranks still leave a held person out', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      people: [
        { id: 1, name: 'Ann',  alpha: 5, beta: 20, gamma: 5, delta: 2, epsilon: 5, zeta: 2,  grade: 'LOW', active: true,  state: 'FINAL' },
        { id: 2, name: 'Bob',  alpha: 4, beta: 10, gamma: 4, delta: 1, epsilon: 3, zeta: 1,  grade: 'MID', active: true,  state: 'DRAFT' },
        { id: 3, name: 'Cyd',  alpha: 2, beta: 5,  gamma: 2, delta: 1, epsilon: 1, zeta: 1,  grade: 'LOW', active: false, state: 'FINAL' },
        { id: 9, name: 'Hela', alpha: 3, beta: 5,  gamma: 3, delta: 1, epsilon: 2, zeta: -7, grade: 'MID', active: true,  state: 'FINAL', hold: true },
      ],
      sheets: [
        { id: 'S9', people: [
          { id: 1, name: 'Sol', alpha: 2, beta: 5, gamma: 2, delta: 1, epsilon: 1, zeta: 1, grade: 'LOW', active: true, state: 'FINAL' },
        ] },
      ],
      shares: [{ personId: 8, fromSheetId: 'S9', fromPersonId: 1, state: 'FINAL' }],
    });
    await page.goto('/');

    await expect(page.getByTestId('rollup-active-count')).toHaveText('3'); // Ann, Bob, Sol (not Hela)
    await expect(page.getByTestId('band-count-D')).toHaveText('3');        // Bob, Cyd, Sol (not Hela)
    // ranks among Ann 100, Bob 40, Cyd 10, Sol 10 (level, so sharing a rank) ; Hela (15) has none
    await expect(page.getByTestId('person-row-2').getByTestId('concept-rank')).toHaveText('2');
    await expect(page.getByTestId('person-row-3').getByTestId('concept-rank')).toHaveText('3');
    await expect(page.getByTestId('person-row-9').getByTestId('concept-rank')).toHaveText('n/a');
    await expect(page.getByTestId('person-row-9').getByTestId('concept-percentile')).toHaveText('n/a');
  });
});
