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
// With MID weighing 4 (first test): Bob load 40*4 = 160, Hela load 15*4 = 60 -> 30 at half

// The first test's sheet has its own grade weight for MID, 4 (LOW 1 and HIGH 5 as usual).
// The anchor is 2026-03-01. Ann's beta becomes 30 (first test) from 2026-04-01: a change dated after the anchor does not count yet.
// Sol is shared from sheet S9 as row 8: counted here like anyone. Sol: momentum 20, LOW load 20, active, effective 20, torque 1, blend 21, D;
// on this sheet Sol starts in DRAFT, so the final total leaves Sol out.
test.describe('hold at half', () => {
  test('totals count a held person at half, to the nearest', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      anchor: '2026-03-01',
      settings: { gradeWeights: { LOW: 1, MID: 4, HIGH: 5 } },
      people: [
        { id: 1, name: 'Ann',  alpha: 5, beta: 20, gamma: 5, delta: 2, epsilon: 5, zeta: 2,  grade: 'LOW', active: true,  state: 'FINAL' },
        { id: 2, name: 'Bob',  alpha: 4, beta: 10, gamma: 4, delta: 1, epsilon: 3, zeta: 1,  grade: 'MID', active: true,  state: 'DRAFT' },
        { id: 3, name: 'Cyd',  alpha: 2, beta: 5,  gamma: 2, delta: 1, epsilon: 1, zeta: 1,  grade: 'LOW', active: false, state: 'FINAL' },
        { id: 9, name: 'Hela', alpha: 3, beta: 5,  gamma: 3, delta: 1, epsilon: 2, zeta: -7, grade: 'MID', active: true,  state: 'FINAL', hold: true },
      ],
      history: [{ personId: 1, field: 'beta', value: 30, from: '2026-04-01' }],
      sheets: [{ id: 'S9', people: [{ id: 1, name: 'Sol', alpha: 4, beta: 5, gamma: 4, delta: 1, epsilon: 1, zeta: 1, grade: 'LOW', active: true, state: 'FINAL' }] }],
      shares: [{ personId: 8, fromSheetId: 'S9', fromPersonId: 1 }],
    });
    await page.goto('/');

    await expect(page.getByTestId('rollup-total-load')).toHaveText('320');      // 100+160+10 + 20 (Sol) + 30
    await expect(page.getByTestId('rollup-total-effective')).toHaveText('173'); // 100+40+5 + 20 (Sol) + 8
    await expect(page.getByTestId('rollup-final-total')).toHaveText('213');     // 200+5 + 8 (Sol is DRAFT here)
    await expect(page.getByTestId('rollup-total-blend')).toHaveText('185');     // 110+43+11 + 21 (Sol) + 0
  });

  test('counts and ranks still leave a held person out', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      people: [
        { id: 1, name: 'Ann',  alpha: 5, beta: 20, gamma: 5, delta: 2, epsilon: 5, zeta: 2,  grade: 'LOW', active: true,  state: 'FINAL' },
        { id: 2, name: 'Bob',  alpha: 4, beta: 10, gamma: 4, delta: 1, epsilon: 3, zeta: 1,  grade: 'MID', active: true,  state: 'DRAFT' },
        { id: 3, name: 'Cyd',  alpha: 2, beta: 5,  gamma: 2, delta: 1, epsilon: 1, zeta: 1,  grade: 'LOW', active: false, state: 'FINAL' },
        { id: 9, name: 'Hela', alpha: 3, beta: 5,  gamma: 3, delta: 1, epsilon: 2, zeta: -7, grade: 'MID', active: true,  state: 'FINAL', hold: true },
      ],
      sheets: [{ id: 'S9', people: [{ id: 1, name: 'Sol', alpha: 4, beta: 5, gamma: 4, delta: 1, epsilon: 1, zeta: 1, grade: 'LOW', active: true, state: 'FINAL' }] }],
      shares: [{ personId: 8, fromSheetId: 'S9', fromPersonId: 1 }],
    });
    await page.goto('/');

    await expect(page.getByTestId('rollup-active-count')).toHaveText('3'); // Ann, Bob, Sol (not Hela)
    await expect(page.getByTestId('band-count-D')).toHaveText('3');        // Bob, Cyd, Sol (not Hela)
    // ranks among Ann 100, Bob 40, Sol 20, Cyd 10 ; Hela (15) has none
    await expect(page.getByTestId('person-row-2').getByTestId('concept-rank')).toHaveText('2');
    await expect(page.getByTestId('person-row-3').getByTestId('concept-rank')).toHaveText('4');
    await expect(page.getByTestId('person-row-9').getByTestId('concept-rank')).toHaveText('n/a');
    await expect(page.getByTestId('person-row-9').getByTestId('concept-percentile')).toHaveText('n/a');
  });
});
