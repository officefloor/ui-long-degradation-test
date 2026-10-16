import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// A person can be put on hold (seeded as `hold: true`, toggled with `person-hold-<id>`, shown in the
// row's `person-hold` cell as yes or no). A person on hold still shows with all of their own
// figures. In every sheet-wide total they count at half their value, rounded to the nearest (a half
// rounds up). They are left out
// of every count, the ranks and percentiles (they show n/a), the leader, every top name, and the
// median that norm measures against. Their own norm is still measured against the median of the
// people not on hold.
//
// Everyone is active with no patrons or follows, so effective = net = momentum, influence =
// momentum, crest = momentum + torque, adjusted = momentum + score (score 0 when blank).
//   Ann  momentum 100, MID  load 300, torque 300 crest 400, adjusted 100 -> C scaled 200, FINAL, N1
//   Bob  momentum 40,  LOW  load 40,  torque 2   crest 42,  adjusted 40  -> D scaled 40,  FINAL, S2
//   Cyd  momentum 200, LOW  load 200, torque 10  crest 210, adjusted 200 -> C scaled 400, REVIEW, N1
//   Dee  momentum 300, LOW  load 300, torque 5   crest 305, adjusted 300 -> B scaled 900, DRAFT
//   Eli  momentum 10,  HIGH load 50,  torque 1   crest 11,  adjusted 10  -> D scaled 10,  DRAFT
//   Hela (on hold) momentum 400+3*1=403, LOW load 403, torque 400 crest 803,
//        adjusted 403-350=53 -> D scaled 53, FINAL, N1
// Hela would top every ranking, would add to every count, and would move the median. In the
// totals she counts at half: load 403 -> 201.5 -> 202, effective 403 -> 202, scaled 53 -> 26.5 -> 27.
//
// Sol is shared from sheet S9 as row 8 and counted here like anyone: momentum 50, LOW, active,
// torque 1, crest 51, adjusted 50 -> D scaled 50. A shared person starts in DRAFT on this sheet, so
// the final total leaves Sol out.
// The anchor is 2026-03-01, and each test has one change dated 2026-04-01: a change dated after the
// anchor does not count yet (Hela's beta 25 in the first two tests, Dee's beta 15 in the third, Ann's
// beta 30 in the last).
// The first two tests' sheet weighs LOW at 2 (MID 3, HIGH 5 as usual): Bob load 80, Cyd 400, Dee 600,
// Sol 100, Hela 806. The third test's sheet multiplies band D by 2: Bob scaled 80, Eli 20, Sol 100,
// Hela 106.

test.describe('hold', () => {
  test('a held person shows their own figures, with rank and percentile n/a', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      anchor: '2026-03-01',
      settings: { gradeWeights: { LOW: 2 } },
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
      sheets: [{ id: 'S9', people: [{ id: 1, name: 'Sol', alpha: 5, beta: 10, gamma: 5, delta: 1, epsilon: 1, zeta: 1, grade: 'LOW', active: true, state: 'FINAL' }] }],
      shares: [{ personId: 8, fromSheetId: 'S9', fromPersonId: 1 }],
      history: [{ personId: 9, field: 'beta', value: 25, from: '2026-04-01' }],
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
    // her norm is measured against the median of the others' scaled (10, 40, 50, 200, 400, 900 ->
    // lower middle 50): 53 - 50 = 3, not an outlier (with her own 53 counted the median would be 53)
    await expect(page.getByTestId('person-row-9').getByTestId('concept-norm')).toHaveText('3');
    await expect(page.getByTestId('person-row-9').getByTestId('concept-outlier')).toHaveText('no');

    await expect(page.getByTestId('person-row-9').getByTestId('concept-rank')).toHaveText('n/a');
    await expect(page.getByTestId('person-row-9').getByTestId('concept-percentile')).toHaveText('n/a');
  });

  test('sheet-wide totals and counts honour the hold', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      anchor: '2026-03-01',
      settings: { gradeWeights: { LOW: 2 } },
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
      sheets: [{ id: 'S9', people: [{ id: 1, name: 'Sol', alpha: 5, beta: 10, gamma: 5, delta: 1, epsilon: 1, zeta: 1, grade: 'LOW', active: true, state: 'FINAL' }] }],
      shares: [{ personId: 8, fromSheetId: 'S9', fromPersonId: 1 }],
      history: [{ personId: 9, field: 'beta', value: 25, from: '2026-04-01' }],
    });
    await page.goto('/');

    // Hela is on hold: counted at half in every total, left out of every count
    await expect(page.getByTestId('rollup-total-load')).toHaveText('1933');     // 300+80+400+600+50 + 100 (Sol) + 403
    await expect(page.getByTestId('rollup-active-count')).toHaveText('6');      // with Sol, not 7
    await expect(page.getByTestId('rollup-total-effective')).toHaveText('902'); // 100+40+200+300+10 + 50 (Sol) + 202
    await expect(page.getByTestId('rollup-final-total')).toHaveText('267');     // Ann 200 + Bob 40 + 27 (Sol is DRAFT here)
    await expect(page.getByTestId('region-count-N1')).toHaveText('2');          // Ann, Cyd (not Hela)
    await expect(page.getByTestId('region-count-S2')).toHaveText('1');          // Bob
    await expect(page.getByTestId('band-count-D')).toHaveText('3');             // Bob, Eli, Sol (not Hela)
    await expect(page.getByTestId('band-count-C')).toHaveText('2');             // Ann, Cyd
    await expect(page.getByTestId('band-count-B')).toHaveText('1');             // Dee
  });

  test('leader, top names, ranks and the median leave a held person out', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      anchor: '2026-03-01',
      settings: { bandMultipliers: { D: 2 } },
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
      sheets: [{ id: 'S9', people: [{ id: 1, name: 'Sol', alpha: 5, beta: 10, gamma: 5, delta: 1, epsilon: 1, zeta: 1, grade: 'LOW', active: true, state: 'FINAL' }] }],
      shares: [{ personId: 8, fromSheetId: 'S9', fromPersonId: 1 }],
      history: [{ personId: 4, field: 'beta', value: 15, from: '2026-04-01' }],
    });
    await page.goto('/');

    // Hela (momentum 403, influence 403, crest 803) would top all three
    await expect(page.getByTestId('rollup-leader')).toHaveText('Dee');          // momentum 300
    await expect(page.getByTestId('rollup-top-influence')).toHaveText('Dee');   // influence 300
    await expect(page.getByTestId('rollup-top-crest')).toHaveText('Ann');       // crest 400

    // ranks among the six not on hold: Dee 300, Cyd 200, Ann 100, Sol 50, Bob 40, Eli 10
    // percentile (6 - rank) / 5 * 100: 100, 80, 60, 40, 20, 0 (with Hela counted, 16.7 a step)
    await expect(page.getByTestId('person-row-4').getByTestId('concept-rank')).toHaveText('1');
    await expect(page.getByTestId('person-row-3').getByTestId('concept-rank')).toHaveText('2');
    await expect(page.getByTestId('person-row-1').getByTestId('concept-rank')).toHaveText('3');
    await expect(page.getByTestId('person-row-5').getByTestId('concept-rank')).toHaveText('6');
    await expect(page.getByTestId('person-row-4').getByTestId('concept-percentile')).toHaveText('100');
    await expect(page.getByTestId('person-row-3').getByTestId('concept-percentile')).toHaveText('80');
    await expect(page.getByTestId('person-row-2').getByTestId('concept-percentile')).toHaveText('20');

    // median of scaled without Hela: 20, 80, 100, 200, 400, 900 -> lower middle 100
    // (with Hela: 20, 80, 100, 106, 200, 400, 900 -> 106)
    // norm: Ann 100, Bob -20, Cyd 300, Dee 800, Eli -80, Sol 0 -> outliers Cyd, Dee = 2
    await expect(page.getByTestId('person-row-1').getByTestId('concept-norm')).toHaveText('100');
    await expect(page.getByTestId('person-row-2').getByTestId('concept-norm')).toHaveText('-20');
    await expect(page.getByTestId('person-row-4').getByTestId('concept-norm')).toHaveText('800');
    await expect(page.getByTestId('person-row-1').getByTestId('concept-outlier')).toHaveText('no');
    await expect(page.getByTestId('rollup-outlier-count')).toHaveText('2'); // Hela is not counted
  });

  test('putting a person on hold and taking them off changes the totals', { tag: '@functionality' }, async ({ page }) => {
    // This sheet weighs MID at 5 (LOW 1, HIGH 5 as usual).
    // Ann momentum 100, LOW -> load 100 ; Bob momentum 15, MID -> load 75 ; Sol (shared) momentum 10, LOW -> load 10
    await resetAndSeed({
      settings: { gradeWeights: { MID: 5 } },
      anchor: '2026-03-01',
      people: [
        { id: 1, name: 'Ann', alpha: 5, beta: 20, gamma: 5, grade: 'LOW', active: true },
        { id: 2, name: 'Bob', alpha: 3, beta: 5,  gamma: 3, grade: 'MID', active: true },
      ],
      sheets: [{ id: 'S9', people: [{ id: 1, name: 'Sol', alpha: 2, beta: 5, gamma: 2, grade: 'LOW', active: true }] }],
      shares: [{ personId: 8, fromSheetId: 'S9', fromPersonId: 1 }],
      history: [{ personId: 1, field: 'beta', value: 30, from: '2026-04-01' }],
    });
    await page.goto('/');

    await expect(page.getByTestId('person-row-2').getByTestId('person-hold')).toHaveText('no');
    await expect(page.getByTestId('rollup-total-load')).toHaveText('185'); // 100 + 75 + 10
    await expect(page.getByTestId('rollup-active-count')).toHaveText('3');

    // Bob on hold: his load counts at half (75 -> 37.5 -> 38), and he is left out of the count
    await page.getByTestId('person-hold-2').click();
    await expect(page.getByTestId('person-row-2').getByTestId('person-hold')).toHaveText('yes');
    await expect(page.getByTestId('rollup-total-load')).toHaveText('148'); // 100 + 38 + 10
    await expect(page.getByTestId('rollup-active-count')).toHaveText('2');
    await expect(page.getByTestId('person-row-2').getByTestId('concept-load')).toHaveText('75');

    // off hold again: counted as before
    await page.getByTestId('person-hold-2').click();
    await expect(page.getByTestId('person-row-2').getByTestId('person-hold')).toHaveText('no');
    await expect(page.getByTestId('rollup-total-load')).toHaveText('185');
    await expect(page.getByTestId('rollup-active-count')).toHaveText('3');
  });
});
