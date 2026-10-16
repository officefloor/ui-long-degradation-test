import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// A person can be put on hold (seeded as `hold: true`, toggled with `person-hold-<id>`, shown in the
// row's `person-hold` cell as yes or no). A person on hold still shows with all of their own
// figures. In every sheet-wide total they count at half their value, rounded to the nearest (a half
// rounds up). They are left out
// of every count, the ranks and percentiles (they show n/a), the leader, every top name, and the
// average that norm measures against. Their own norm is still measured against the average of the
// people not on hold.
//
// Everyone is active with no patrons or follows, so effective = net = momentum, influence =
// momentum, crest = momentum + torque, adjusted = momentum + score (score 0 when blank).
// The sheet multiplies band C by 3 (not 2) and weighs LOW 2, MID 4, HIGH 5 (not 1, 3, 5).
//   Ann  momentum 100, MID  load 400, torque 300 crest 400, adjusted 100 -> C scaled 300, FINAL, N1
//   Bob  momentum 40,  LOW  load 80,  torque 2   crest 42,  adjusted 40  -> D scaled 40,  FINAL, S2
//   Cyd  momentum 200, LOW  load 400, torque 10  crest 210, adjusted 200 -> C scaled 600, REVIEW, N1
//   Dee  momentum 300, LOW  load 600, torque 5   crest 305, adjusted 300 -> B scaled 900, DRAFT
//   Eli  momentum 10,  HIGH load 50,  torque 1   crest 11,  adjusted 10  -> D scaled 10,  DRAFT
//   Hela (on hold) momentum 400+3*1=403, LOW load 806, torque 400 crest 803,
//        adjusted 403-350=53 -> D scaled 53, FINAL, N1
// Sol is shared from sheet S9 as row 8: counted here like anyone (momentum 50, LOW load 100,
// torque 1 crest 51, D scaled 50, FINAL here, no region).
// A change dated after the anchor does not count yet: Eli's beta 50 from 2026-04-01 (momentum 100).
// Hela would top every ranking, would add to every count, and would move the average. In the
// totals she counts at half: load 806 -> 403, effective 403 -> 201.5 -> 202, scaled 53 -> 26.5 -> 27.

test.describe('hold', () => {
  test('a held person shows their own figures, with rank and percentile n/a', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      anchor: '2026-03-01',
      settings: { bandMultipliers: { A: 4, B: 3, C: 3, D: 1, E: 0 }, gradeWeights: { LOW: 2, MID: 4, HIGH: 5 } },
      people: [
        { id: 1, name: 'Ann',  alpha: 5,  beta: 20, gamma: 5,  delta: 10, epsilon: 30, zeta: 10, grade: 'MID',  active: true, state: 'FINAL' },
        { id: 2, name: 'Bob',  alpha: 4,  beta: 10, gamma: 4,  delta: 1,  epsilon: 2,  zeta: 1,  grade: 'LOW',  active: true, state: 'FINAL' },
        { id: 3, name: 'Cyd',  alpha: 10, beta: 20, gamma: 10, delta: 2,  epsilon: 5,  zeta: 2,  grade: 'LOW',  active: true, state: 'REVIEW' },
        { id: 4, name: 'Dee',  alpha: 10, beta: 30, gamma: 10, delta: 1,  epsilon: 5,  zeta: 1,  grade: 'LOW',  active: true, state: 'DRAFT' },
        { id: 5, name: 'Eli',  alpha: 2,  beta: 5,  gamma: 2,  delta: 1,  epsilon: 1,  zeta: 1,  grade: 'HIGH', active: true, state: 'DRAFT' },
        { id: 9, name: 'Hela', alpha: 20, beta: 20, gamma: 21, delta: 10, epsilon: 40, zeta: 10, grade: 'LOW',  active: true, state: 'FINAL', score: -350, hold: true },
      ],
      regions: [
        { personId: 1, region: 'N1' }, { personId: 3, region: 'N1' }, { personId: 9, region: 'N1' },
        { personId: 2, region: 'S2' },
      ],
      sheets: [
        { id: 'S9', people: [
          { id: 1, name: 'Sol', alpha: 5, beta: 10, gamma: 5, delta: 1, epsilon: 1, zeta: 1, grade: 'LOW', active: true, state: 'FINAL' },
        ] },
      ],
      shares: [{ personId: 8, fromSheetId: 'S9', fromPersonId: 1, state: 'FINAL' }],
      history: [{ personId: 5, field: 'beta', value: 50, from: '2026-04-01' }],
    });
    await page.goto('/');

    // the held row still shows on the list
    await expect(page.getByTestId('person-row-9').getByTestId('person-hold')).toHaveText('yes');
    await expect(page.getByTestId('person-row-1').getByTestId('person-hold')).toHaveText('no');

    // Hela's own figures are worked out as usual
    await expect(page.getByTestId('person-row-9').getByTestId('concept-momentum')).toHaveText('403');
    await expect(page.getByTestId('person-row-9').getByTestId('concept-load')).toHaveText('806');
    await expect(page.getByTestId('person-row-9').getByTestId('concept-crest')).toHaveText('803');
    await expect(page.getByTestId('person-row-9').getByTestId('concept-scaled')).toHaveText('53');
    // her norm is measured against the average of the others ((300+40+600+900+10+50)/6 = 1900/6 = 316):
    // 53 - 316 = -263, an outlier
    await expect(page.getByTestId('person-row-9').getByTestId('concept-norm')).toHaveText('-263');
    await expect(page.getByTestId('person-row-9').getByTestId('concept-outlier')).toHaveText('yes');

    await expect(page.getByTestId('person-row-9').getByTestId('concept-rank')).toHaveText('n/a');
    await expect(page.getByTestId('person-row-9').getByTestId('concept-percentile')).toHaveText('n/a');
  });

  test('sheet-wide totals and counts honour the hold', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      anchor: '2026-03-01',
      settings: { bandMultipliers: { A: 4, B: 3, C: 3, D: 1, E: 0 }, gradeWeights: { LOW: 2, MID: 4, HIGH: 5 } },
      people: [
        { id: 1, name: 'Ann',  alpha: 5,  beta: 20, gamma: 5,  delta: 10, epsilon: 30, zeta: 10, grade: 'MID',  active: true, state: 'FINAL' },
        { id: 2, name: 'Bob',  alpha: 4,  beta: 10, gamma: 4,  delta: 1,  epsilon: 2,  zeta: 1,  grade: 'LOW',  active: true, state: 'FINAL' },
        { id: 3, name: 'Cyd',  alpha: 10, beta: 20, gamma: 10, delta: 2,  epsilon: 5,  zeta: 2,  grade: 'LOW',  active: true, state: 'REVIEW' },
        { id: 4, name: 'Dee',  alpha: 10, beta: 30, gamma: 10, delta: 1,  epsilon: 5,  zeta: 1,  grade: 'LOW',  active: true, state: 'DRAFT' },
        { id: 5, name: 'Eli',  alpha: 2,  beta: 5,  gamma: 2,  delta: 1,  epsilon: 1,  zeta: 1,  grade: 'HIGH', active: true, state: 'DRAFT' },
        { id: 9, name: 'Hela', alpha: 20, beta: 20, gamma: 21, delta: 10, epsilon: 40, zeta: 10, grade: 'LOW',  active: true, state: 'FINAL', score: -350, hold: true },
      ],
      regions: [
        { personId: 1, region: 'N1' }, { personId: 3, region: 'N1' }, { personId: 9, region: 'N1' },
        { personId: 2, region: 'S2' },
      ],
      sheets: [
        { id: 'S9', people: [
          { id: 1, name: 'Sol', alpha: 5, beta: 10, gamma: 5, delta: 1, epsilon: 1, zeta: 1, grade: 'LOW', active: true, state: 'FINAL' },
        ] },
      ],
      shares: [{ personId: 8, fromSheetId: 'S9', fromPersonId: 1, state: 'FINAL' }],
      history: [{ personId: 5, field: 'beta', value: 50, from: '2026-04-01' }],
    });
    await page.goto('/');

    // Hela is on hold: counted at half in every total, left out of every count
    // rollup-total-load: Ann 400 + Bob 80 + Cyd 400 + Dee 600 + Eli 50 + Sol 100 + Hela 403 (half of 806) = 2033; leave out the highest contribution, Dee's 600 -> 1433
    await expect(page.getByTestId('rollup-total-load')).toHaveText('1433');
    await expect(page.getByTestId('rollup-active-count')).toHaveText('6');      // not 7
    // rollup-total-effective: Ann 100 + Bob 40 + Cyd 200 + Dee 300 + Eli 10 + Sol 50 + Hela 202 (half of 403) = 902; leave out the highest contribution, Dee's 300 -> 602
    await expect(page.getByTestId('rollup-total-effective')).toHaveText('602');
    // rollup-final-total: Ann 300 + Bob 40 + Sol 50 + Hela 27 (half of 53) = 417; leave out the highest contribution, Ann's 300 -> 117
    await expect(page.getByTestId('rollup-final-total')).toHaveText('117');
    await expect(page.getByTestId('region-count-N1')).toHaveText('2');          // Ann, Cyd (not Hela)
    await expect(page.getByTestId('region-count-S2')).toHaveText('1');          // Bob
    await expect(page.getByTestId('band-count-D')).toHaveText('3');             // Bob, Eli, Sol (not Hela)
    await expect(page.getByTestId('band-count-C')).toHaveText('2');             // Ann, Cyd
    await expect(page.getByTestId('band-count-B')).toHaveText('1');             // Dee
  });

  test('leader, top names, ranks and the median leave a held person out', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      anchor: '2026-03-01',
      settings: { bandMultipliers: { A: 4, B: 3, C: 3, D: 1, E: 0 }, gradeWeights: { LOW: 2, MID: 4, HIGH: 5 } },
      people: [
        { id: 1, name: 'Ann',  alpha: 5,  beta: 20, gamma: 5,  delta: 10, epsilon: 30, zeta: 10, grade: 'MID',  active: true, state: 'FINAL' },
        { id: 2, name: 'Bob',  alpha: 4,  beta: 10, gamma: 4,  delta: 1,  epsilon: 2,  zeta: 1,  grade: 'LOW',  active: true, state: 'FINAL' },
        { id: 3, name: 'Cyd',  alpha: 10, beta: 20, gamma: 10, delta: 2,  epsilon: 5,  zeta: 2,  grade: 'LOW',  active: true, state: 'REVIEW' },
        { id: 4, name: 'Dee',  alpha: 10, beta: 30, gamma: 10, delta: 1,  epsilon: 5,  zeta: 1,  grade: 'LOW',  active: true, state: 'DRAFT' },
        { id: 5, name: 'Eli',  alpha: 2,  beta: 5,  gamma: 2,  delta: 1,  epsilon: 1,  zeta: 1,  grade: 'HIGH', active: true, state: 'DRAFT' },
        { id: 9, name: 'Hela', alpha: 20, beta: 20, gamma: 21, delta: 10, epsilon: 40, zeta: 10, grade: 'LOW',  active: true, state: 'FINAL', score: -350, hold: true },
      ],
      regions: [
        { personId: 1, region: 'N1' }, { personId: 3, region: 'N1' }, { personId: 9, region: 'N1' },
        { personId: 2, region: 'S2' },
      ],
      sheets: [
        { id: 'S9', people: [
          { id: 1, name: 'Sol', alpha: 5, beta: 10, gamma: 5, delta: 1, epsilon: 1, zeta: 1, grade: 'LOW', active: true, state: 'FINAL' },
        ] },
      ],
      shares: [{ personId: 8, fromSheetId: 'S9', fromPersonId: 1, state: 'FINAL' }],
      history: [{ personId: 5, field: 'beta', value: 50, from: '2026-04-01' }],
    });
    await page.goto('/');

    // Hela (momentum 403, influence 403, crest 803) would top all three
    await expect(page.getByTestId('rollup-leader')).toHaveText('Dee');          // momentum 300
    await expect(page.getByTestId('rollup-top-influence')).toHaveText('Dee');   // influence 300
    await expect(page.getByTestId('rollup-top-crest')).toHaveText('Ann');       // crest 400

    // ranks among the six not on hold: Dee 300, Cyd 200, Ann 100, Sol 50, Bob 40, Eli 10
    // percentile (6 - rank) / 5 * 100: 100, 80, 60, 40, 20, 0 (with Hela counted it would step by 100/6)
    await expect(page.getByTestId('person-row-4').getByTestId('concept-rank')).toHaveText('1');
    await expect(page.getByTestId('person-row-3').getByTestId('concept-rank')).toHaveText('2');
    await expect(page.getByTestId('person-row-1').getByTestId('concept-rank')).toHaveText('3');
    await expect(page.getByTestId('person-row-5').getByTestId('concept-rank')).toHaveText('6');
    await expect(page.getByTestId('person-row-4').getByTestId('concept-percentile')).toHaveText('100');
    await expect(page.getByTestId('person-row-3').getByTestId('concept-percentile')).toHaveText('80');
    await expect(page.getByTestId('person-row-2').getByTestId('concept-percentile')).toHaveText('20');

    // average of scaled without Hela: (300+40+600+900+10+50)/6 = 1900/6 = 316 (with Hela it would be
    // 1953/7 = 279)
    // norm: Ann -16, Bob -276, Cyd 284, Dee 584, Eli -306, Sol -266 -> outliers Bob, Cyd, Dee, Eli, Sol = 5
    await expect(page.getByTestId('person-row-1').getByTestId('concept-norm')).toHaveText('-16');
    await expect(page.getByTestId('person-row-2').getByTestId('concept-norm')).toHaveText('-276');
    await expect(page.getByTestId('person-row-4').getByTestId('concept-norm')).toHaveText('584');
    await expect(page.getByTestId('person-row-1').getByTestId('concept-outlier')).toHaveText('no');
    await expect(page.getByTestId('rollup-outlier-count')).toHaveText('5'); // Hela's own yes is not counted
  });

  test('putting a person on hold and taking them off changes the totals', { tag: '@functionality' }, async ({ page }) => {
    // The sheet weighs LOW 2, MID 4: Ann momentum 100, LOW -> load 200 ; Bob momentum 15, MID -> load 60
    // Sol is shared from sheet S9 as row 8: counted here like anyone (momentum 50, LOW -> load 100).
    // A change dated after the anchor does not count yet: Bob's beta 10 from 2026-04-01.
    await resetAndSeed({
      anchor: '2026-03-01',
      settings: { gradeWeights: { LOW: 2, MID: 4, HIGH: 5 } },
      people: [
        { id: 1, name: 'Ann', alpha: 5, beta: 20, gamma: 5, grade: 'LOW', active: true },
        { id: 2, name: 'Bob', alpha: 3, beta: 5,  gamma: 3, grade: 'MID', active: true },
      ],
      sheets: [
        { id: 'S9', people: [
          { id: 1, name: 'Sol', alpha: 5, beta: 10, gamma: 5, grade: 'LOW', active: true },
        ] },
      ],
      shares: [{ personId: 8, fromSheetId: 'S9', fromPersonId: 1 }],
      history: [{ personId: 2, field: 'beta', value: 10, from: '2026-04-01' }],
    });
    await page.goto('/');

    await expect(page.getByTestId('person-row-2').getByTestId('person-hold')).toHaveText('no');
    // rollup-total-load: Ann 200 + Bob 60 + Sol 100 = 360; leave out the highest contribution, Ann's 200 -> 160
    await expect(page.getByTestId('rollup-total-load')).toHaveText('160');
    await expect(page.getByTestId('rollup-active-count')).toHaveText('3');

    // Bob on hold: his load counts at half (60 -> 30), and he is left out of the count
    await page.getByTestId('person-hold-2').click();
    await expect(page.getByTestId('person-row-2').getByTestId('person-hold')).toHaveText('yes');
    // rollup-total-load: Ann 200 + Bob 30 (half of 60) + Sol 100 = 330; leave out the highest contribution, Ann's 200 -> 130
    await expect(page.getByTestId('rollup-total-load')).toHaveText('130');
    await expect(page.getByTestId('rollup-active-count')).toHaveText('2');
    await expect(page.getByTestId('person-row-2').getByTestId('concept-load')).toHaveText('60');

    // off hold again: counted as before
    await page.getByTestId('person-hold-2').click();
    await expect(page.getByTestId('person-row-2').getByTestId('person-hold')).toHaveText('no');
    // rollup-total-load: Ann 200 + Bob 60 + Sol 100 = 360; leave out the highest contribution, Ann's 200 -> 160
    await expect(page.getByTestId('rollup-total-load')).toHaveText('160');
    await expect(page.getByTestId('rollup-active-count')).toHaveText('3');
  });
});
