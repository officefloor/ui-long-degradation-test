import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';
import { auditLines } from '../support/audit';

// History covers a person's grade and whether they are active, as it does alpha, beta and gamma.
// Seeded as `history: [{ personId, field: 'grade', value: 'HIGH', from }]` or `{ field: 'active',
// value: false, from }`; in the editor, `person-form-grade` and `person-form-active` (yes or no) are
// dated by `person-form-effective-date` like the numbers (blank means the anchor). Every figure uses
// the grade and active in force on the date the sheet is showing: the anchor, or the as-of date. A
// change dated after it is listed but does not count yet. `person-history` lists grade changes as
// "<date> grade <grade>" and active changes as "<date> active yes|no"; same-date changes go alpha,
// beta, gamma, grade, active.
//
// The sheet weighs LOW 1, MID 4, HIGH 6 (not 1, 3, 5); load = momentum * weight. Effective is net when
// active, else half of net (to the nearest); an inactive patron counts in nobody's figures. Nobody has
// follows or a score.
//   Ann  alpha 10, beta 10: momentum 100; LOW, HIGH from 2026-02-01
//   Bob  alpha 5,  beta 10: momentum 50;  MID, not active from 2026-02-15; Cyd's patron
//   Cyd  alpha 4,  beta 10: momentum 40;  LOW, HIGH from 2026-04-01 (after the anchor)
//   Dee  alpha 3,  beta 10: momentum 30;  LOW
// Hela is on hold: momentum 20, LOW, HIGH from 2026-01-01 -> load 120, counted at half (60) in the
// total load; effective 20, at half 10. She is left out of every count.
// Sol is shared from sheet S9 as row 8: counted here like anyone (alpha 1, beta 10: momentum 10, LOW,
// active, load 10, effective 10).
test.describe('history covers grade and active', () => {
  test('dated grade and active changes count from their date, and the as-of view follows them', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      anchor: '2026-03-01',
      settings: { gradeWeights: { LOW: 1, MID: 4, HIGH: 6 } },
      people: [
        { id: 1, name: 'Ann',  alpha: 10, beta: 10, gamma: 10, grade: 'LOW', active: true, state: 'FINAL' },
        { id: 2, name: 'Bob',  alpha: 5,  beta: 10, gamma: 5,  grade: 'MID', active: true, state: 'FINAL' },
        { id: 3, name: 'Cyd',  alpha: 4,  beta: 10, gamma: 4,  grade: 'LOW', active: true, state: 'FINAL' },
        { id: 4, name: 'Dee',  alpha: 3,  beta: 10, gamma: 3,  grade: 'LOW', active: true, state: 'FINAL' },
        { id: 9, name: 'Hela', alpha: 2,  beta: 10, gamma: 2,  grade: 'LOW', active: true, state: 'FINAL', hold: true },
      ],
      patrons: [{ personId: 3, patronId: 2 }],
      history: [
        { personId: 1, field: 'grade',  value: 'HIGH', from: '2026-02-01' },
        { personId: 2, field: 'active', value: false,  from: '2026-02-15' },
        { personId: 3, field: 'grade',  value: 'HIGH', from: '2026-04-01' },
        { personId: 9, field: 'grade',  value: 'HIGH', from: '2026-01-01' },
      ],
      sheets: [
        { id: 'S9', people: [
          { id: 1, name: 'Sol', alpha: 1, beta: 10, gamma: 1, grade: 'LOW', active: true, state: 'FINAL' },
        ] },
      ],
      shares: [{ personId: 8, fromSheetId: 'S9', fromPersonId: 1, state: 'FINAL' }],
    });
    await page.goto('/');
    const row = (id: number) => page.getByTestId(`person-row-${id}`);

    // on the anchor 2026-03-01: Ann HIGH, Bob not active, Cyd still LOW
    await expect(row(1).getByTestId('person-grade')).toHaveText('HIGH');
    await expect(row(1).getByTestId('concept-load')).toHaveText('600');       // 100 * 6
    await expect(row(2).getByTestId('person-active')).toHaveText('no');
    await expect(row(2).getByTestId('concept-effective')).toHaveText('25');   // half of net 50
    await expect(row(3).getByTestId('person-grade')).toHaveText('LOW');
    await expect(row(3).getByTestId('concept-backing')).toHaveText('n/a');    // Bob, inactive, does not count
    await expect(row(3).getByTestId('person-history')).toHaveText('2026-04-01 grade HIGH');
    await expect(row(2).getByTestId('person-history')).toHaveText('2026-02-15 active no');
    // loads 600, 200, 40, 30, Sol 10 and Hela 60: 940, the highest (600) left out -> 340
    await expect(page.getByTestId('rollup-total-load')).toHaveText('340');
    // effective 100, 25, 40, 30, Sol 10 and Hela 10: 215, the highest (100) left out -> 115
    await expect(page.getByTestId('rollup-total-effective')).toHaveText('115');
    await expect(page.getByTestId('rollup-active-count')).toHaveText('4');    // Ann, Cyd, Dee, Sol
    // grades, MID counted with HIGH: HIGH Ann, Bob; LOW Cyd, Dee, Sol
    await expect(page.getByTestId('grade-tally-HIGH')).toHaveText('2');
    await expect(page.getByTestId('grade-tally-LOW')).toHaveText('3');

    // as of 2026-01-15: Ann still LOW, Bob still active (so Cyd's patron counts again); Hela is
    // already HIGH
    await page.getByTestId('sheet-as-of').fill('2026-01-15');
    await page.getByTestId('sheet-as-of-apply').click();
    await expect(row(1).getByTestId('person-grade')).toHaveText('LOW');
    await expect(row(1).getByTestId('concept-load')).toHaveText('100');       // 100 * 1
    await expect(row(2).getByTestId('person-active')).toHaveText('yes');
    await expect(row(2).getByTestId('concept-effective')).toHaveText('50');
    await expect(row(3).getByTestId('concept-backing')).toHaveText('50');     // Bob's thrust 5 * 10
    await expect(row(3).getByTestId('concept-effective')).toHaveText('90');   // net 40 + 50
    // loads 100, 200, 40, 30, Sol 10 and Hela 60: 440, the highest (200) left out -> 240
    await expect(page.getByTestId('rollup-total-load')).toHaveText('240');
    // effective 100, 50, 90, 30, Sol 10 and Hela 10: 290, the highest (100) left out -> 190
    await expect(page.getByTestId('rollup-total-effective')).toHaveText('190');
    await expect(page.getByTestId('rollup-active-count')).toHaveText('5');
    await expect(page.getByTestId('grade-tally-HIGH')).toHaveText('1');      // Bob (MID)
    await expect(page.getByTestId('grade-tally-LOW')).toHaveText('4');

    await page.getByTestId('sheet-as-of-clear').click();
    await expect(row(1).getByTestId('concept-load')).toHaveText('600');
  });

  test('editing grade and active with a date keeps them in the history', { tag: '@functionality' }, async ({ page }) => {
    // The sheet weighs LOW 1, MID 4, HIGH 6 (not 1, 3, 5).
    // Ann starts LOW and active: load 100 * 1 = 100, effective 100. Dee LOW: load 30.
    // Hela is on hold: load 20 * 1 = 20, counted at half (10); left out of the active count.
    // Sol is shared from sheet S9 as row 8: counted here like anyone (momentum 10, LOW, active, load 10).
    await resetAndSeed({
      anchor: '2026-03-01',
      settings: { gradeWeights: { LOW: 1, MID: 4, HIGH: 6 } },
      people: [
        { id: 1, name: 'Ann',  alpha: 10, beta: 10, gamma: 10, grade: 'LOW', active: true, state: 'FINAL' },
        { id: 4, name: 'Dee',  alpha: 3,  beta: 10, gamma: 3,  grade: 'LOW', active: true, state: 'FINAL' },
        { id: 9, name: 'Hela', alpha: 2,  beta: 10, gamma: 2,  grade: 'LOW', active: true, state: 'FINAL', hold: true },
      ],
      sheets: [
        { id: 'S9', people: [
          { id: 1, name: 'Sol', alpha: 1, beta: 10, gamma: 1, grade: 'LOW', active: true, state: 'FINAL' },
        ] },
      ],
      shares: [{ personId: 8, fromSheetId: 'S9', fromPersonId: 1, state: 'FINAL' }],
    });
    await page.goto('/');
    const ann = page.getByTestId('person-row-1');

    // grade MID from 2026-02-20 (before the anchor, so it counts): load 100 * 4 = 400
    await page.getByTestId('person-edit-1').click();
    await expect(page.getByTestId('person-form-name')).toHaveValue('Ann');
    await page.getByTestId('person-form-grade').fill('MID');
    await page.getByTestId('person-form-effective-date').fill('2026-02-20');
    await page.getByTestId('person-form-submit').click();
    await expect.poll(() => auditLines()).toContain('CHANGED id=1 field=grade from=LOW to=MID');
    await expect(ann.getByTestId('person-grade')).toHaveText('MID');
    await expect(ann.getByTestId('concept-load')).toHaveText('400');

    // not active, date left blank: from the anchor 2026-03-01, which counts: effective half of 100 = 50
    await page.getByTestId('person-edit-1').click();
    await expect(page.getByTestId('person-form-name')).toHaveValue('Ann');
    await page.getByTestId('person-form-active').fill('no');
    await page.getByTestId('person-form-submit').click();
    await expect.poll(() => auditLines()).toContain('CHANGED id=1 field=active from=yes to=no');
    await expect(ann.getByTestId('person-active')).toHaveText('no');
    await expect(ann.getByTestId('concept-effective')).toHaveText('50');
    await expect(ann.getByTestId('person-history')).toHaveText('2026-03-01 active no; 2026-02-20 grade MID');
    await expect(page.getByTestId('rollup-active-count')).toHaveText('2');   // Dee, Sol
    // loads 400, 30, Sol 10 and Hela 10: 450, the highest (400) left out -> 50
    await expect(page.getByTestId('rollup-total-load')).toHaveText('50');

    // as of 2026-02-25: grade MID already, still active
    await page.getByTestId('sheet-as-of').fill('2026-02-25');
    await page.getByTestId('sheet-as-of-apply').click();
    await expect(ann.getByTestId('person-active')).toHaveText('yes');
    await expect(ann.getByTestId('concept-effective')).toHaveText('100');
    await expect(ann.getByTestId('concept-load')).toHaveText('400');
    await expect(page.getByTestId('rollup-active-count')).toHaveText('3');

    // the history is kept
    await page.reload();
    await expect(page.getByTestId('person-row-1').getByTestId('person-history')).toHaveText('2026-03-01 active no; 2026-02-20 grade MID');
  });
});
