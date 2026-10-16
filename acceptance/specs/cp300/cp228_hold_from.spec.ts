import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// A hold has a start date: `people[].holdFrom` (yyyy-mm-dd), shown in the row at `person-hold-from`
// (blank when the hold has no start date). A person counts as on hold only on and after that date:
// on the date the sheet is showing (the anchor, or the as-of date) a hold that starts later does not
// count yet, so `person-hold` shows no and they count like anyone else. A hold with no start date has
// always been on. Putting someone on hold with `person-hold-<id>` starts the hold on the anchor date;
// taking them off clears it. Nobody has patrons, follows or a score, so value (scaled) is momentum
// times the band multiplier (D 0..99 x1, C 100..249 x2, B 250..499 x3).
//   Ann alpha 10, beta 30: momentum 300, value 900
//   Ben alpha 10, beta 20: momentum 200, value 400 (600 where the sheet starts band B at 200)
//   Cyd alpha 5,  beta 20: momentum 100, value 200
//   Hela alpha 3, beta 50: momentum 150, value 300; on hold from 2026-02-01
//   Ivo alpha 2,  beta 30: momentum 60,  value 60;  on hold from 2026-04-01 (after the anchor)
// A held person is out of counts and ranks and counts at half in the grand total, which also leaves
// out its highest contribution.
// Sol is shared from sheet S9 as row 7: counted here like anyone (alpha 5, beta 10: momentum 50,
// value 50, never on hold).
test.describe('a hold has a start date', () => {
  test('a hold counts only from its start date, on the anchor and as of a date', { tag: '@functionality' }, async ({ page }) => {
    // The sheet starts band B at 200 (not 250): Ben's 200 is band B, value 200 x 3 = 600.
    await resetAndSeed({
      anchor: '2026-03-01',
      settings: { bandFrom: { D: 0, C: 100, B: 200, A: 500 } },
      people: [
        { id: 1, name: 'Ann',  alpha: 10, beta: 30, gamma: 10, grade: 'LOW', state: 'FINAL', active: true },
        { id: 2, name: 'Ben',  alpha: 10, beta: 20, gamma: 10, grade: 'LOW', state: 'FINAL', active: true },
        { id: 3, name: 'Cyd',  alpha: 5,  beta: 20, gamma: 5,  grade: 'LOW', state: 'FINAL', active: true },
        { id: 8, name: 'Ivo',  alpha: 2,  beta: 30, gamma: 2,  grade: 'LOW', state: 'FINAL', active: true, hold: true, holdFrom: '2026-04-01' },
        { id: 9, name: 'Hela', alpha: 3,  beta: 50, gamma: 3,  grade: 'LOW', state: 'FINAL', active: true, hold: true, holdFrom: '2026-02-01' },
      ],
      sheets: [
        { id: 'S9', people: [
          { id: 1, name: 'Sol', alpha: 5, beta: 10, gamma: 5, grade: 'LOW', state: 'FINAL', active: true },
        ] },
      ],
      shares: [{ personId: 7, fromSheetId: 'S9', fromPersonId: 1, state: 'FINAL' }],
    });
    await page.goto('/');
    const row = (id: number) => page.getByTestId(`person-row-${id}`);

    await expect(row(9).getByTestId('person-hold-from')).toHaveText('2026-02-01');
    await expect(row(8).getByTestId('person-hold-from')).toHaveText('2026-04-01');
    await expect(row(1).getByTestId('person-hold-from')).toHaveText('');
    // on the anchor: Hela's hold has started, Ivo's has not
    await expect(row(9).getByTestId('person-hold')).toHaveText('yes');
    await expect(row(8).getByTestId('person-hold')).toHaveText('no');
    await expect(page.getByTestId('rollup-headcount')).toHaveText('5');          // Ann, Ben, Cyd, Ivo, Sol
    await expect(row(9).getByTestId('concept-rank')).toHaveText('n/a');
    await expect(row(8).getByTestId('concept-rank')).toHaveText('4');           // 300, 200, 100, 60, Sol 50
    // 900 + 600 + 200 + 60 + Sol 50 + Hela's half 150 = 1960, the highest (900) left out -> 1060
    await expect(page.getByTestId('rollup-ledger')).toHaveText('1060');

    // as of 2026-01-15 neither hold has started: everyone counts
    await page.getByTestId('sheet-as-of').fill('2026-01-15');
    await page.getByTestId('sheet-as-of-apply').click();
    await expect(row(9).getByTestId('person-hold')).toHaveText('no');
    await expect(page.getByTestId('rollup-headcount')).toHaveText('6');
    await expect(row(9).getByTestId('concept-rank')).toHaveText('3');           // 300, 200, 150
    // 900 + 600 + 200 + 300 + 60 + Sol 50 = 2110, the highest (900) left out -> 1210
    await expect(page.getByTestId('rollup-ledger')).toHaveText('1210');

    // as of 2026-04-15 both holds have started
    await page.getByTestId('sheet-as-of').fill('2026-04-15');
    await page.getByTestId('sheet-as-of-apply').click();
    await expect(row(8).getByTestId('person-hold')).toHaveText('yes');
    await expect(page.getByTestId('rollup-headcount')).toHaveText('4');
    await expect(row(8).getByTestId('concept-rank')).toHaveText('n/a');
    // 900 + 600 + 200 + Sol 50 + Hela 150 + Ivo 30 = 1930, the highest (900) left out -> 1030
    await expect(page.getByTestId('rollup-ledger')).toHaveText('1030');
  });

  test('the hold button starts a hold on the anchor date', { tag: '@functionality' }, async ({ page }) => {
    // Hela is on hold from 2026-02-01 throughout. Sol is shared from sheet S9 as row 7: counted here
    // like anyone. Putting Ben on hold starts his hold on the anchor 2026-03-01: on the anchor he is
    // out of the head count (Ann, Cyd, Sol: 3), but as of 2026-02-15 he counts (Ann, Ben, Cyd, Sol: 4;
    // Hela's hold has started by then).
    await resetAndSeed({
      anchor: '2026-03-01',
      people: [
        { id: 1, name: 'Ann',  alpha: 10, beta: 30, gamma: 10, grade: 'LOW', state: 'FINAL', active: true },
        { id: 2, name: 'Ben',  alpha: 10, beta: 20, gamma: 10, grade: 'LOW', state: 'FINAL', active: true },
        { id: 3, name: 'Cyd',  alpha: 5,  beta: 20, gamma: 5,  grade: 'LOW', state: 'FINAL', active: true },
        { id: 9, name: 'Hela', alpha: 3,  beta: 50, gamma: 3,  grade: 'LOW', state: 'FINAL', active: true, hold: true, holdFrom: '2026-02-01' },
      ],
      sheets: [
        { id: 'S9', people: [
          { id: 1, name: 'Sol', alpha: 5, beta: 10, gamma: 5, grade: 'LOW', state: 'FINAL', active: true },
        ] },
      ],
      shares: [{ personId: 7, fromSheetId: 'S9', fromPersonId: 1, state: 'FINAL' }],
    });
    await page.goto('/');
    await expect(page.getByTestId('rollup-headcount')).toHaveText('4');
    await page.getByTestId('person-hold-2').click();
    await expect(page.getByTestId('person-row-2').getByTestId('person-hold')).toHaveText('yes');
    await expect(page.getByTestId('person-row-2').getByTestId('person-hold-from')).toHaveText('2026-03-01');
    await expect(page.getByTestId('rollup-headcount')).toHaveText('3');

    await page.getByTestId('sheet-as-of').fill('2026-02-15');
    await page.getByTestId('sheet-as-of-apply').click();
    await expect(page.getByTestId('person-row-2').getByTestId('person-hold')).toHaveText('no');
    await expect(page.getByTestId('rollup-headcount')).toHaveText('4');

    await page.getByTestId('sheet-as-of-clear').click();
    await expect(page.getByTestId('person-row-2').getByTestId('person-hold')).toHaveText('yes');
    await page.getByTestId('person-hold-2').click();
    await expect(page.getByTestId('person-row-2').getByTestId('person-hold')).toHaveText('no');
    await expect(page.getByTestId('person-row-2').getByTestId('person-hold-from')).toHaveText('');
    await expect(page.getByTestId('rollup-headcount')).toHaveText('4');
  });
});
