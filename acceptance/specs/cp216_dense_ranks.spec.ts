import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// Every rank of people across the sheet is dense: people level on the figure share a rank, and the
// next rank follows on (1, 1, 2, not 1, 1, 3). This replaces the tie-breaks (the higher alpha for the
// rank by momentum, the name for the overall rank). Percentile follows the shared ranks: the top rank
// is 100, the lowest rank 0, evenly in between by rank (rounded to the nearest). Nobody has patrons,
// follows or a score, so value (scaled) is momentum times the band multiplier (D 0..99 x1,
// C 100..249 x2, B 250..499 x3).
//   Ann alpha 10, beta 30: momentum 300, value 900
//   Bob alpha 15, beta 20: momentum 300, value 900 (higher alpha: once ranked above Ann)
//   Cyd alpha 10, beta 20: momentum 200, value 400
//   Dee alpha 5,  beta 20: momentum 100, value 200
//   Eve alpha 2,  beta 10: momentum 20,  value 20
//   Sol alpha 1,  beta 10: momentum 10,  value 10
// Sol is shared from sheet S9: ranked here like anyone, last on both momentum and value.
// A change dated after the anchor does not count yet: Eve's beta 50 from 2026-04-01 (momentum 100,
// level with Dee).
// Hela is on hold: unranked, n/a (counted, her momentum 150 and value 300 would push Dee, Eve and Sol
// down one rank).
test.describe('dense ranks', () => {
  test('level people share a rank and the next rank follows on', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      anchor: '2026-03-01',
      sheets: [
        { id: 'S9', people: [
          { id: 1, name: 'Sol', alpha: 1, beta: 10, gamma: 1, grade: 'LOW', state: 'FINAL', active: true },
        ] },
      ],
      shares: [{ personId: 8, fromSheetId: 'S9', fromPersonId: 1 }],
      history: [{ personId: 5, field: 'beta', value: 50, from: '2026-04-01' }],
      people: [
        { id: 1, name: 'Ann',  alpha: 10, beta: 30, gamma: 10, grade: 'LOW', state: 'FINAL', active: true },
        { id: 2, name: 'Bob',  alpha: 15, beta: 20, gamma: 15, grade: 'LOW', state: 'FINAL', active: true },
        { id: 3, name: 'Cyd',  alpha: 10, beta: 20, gamma: 10, grade: 'LOW', state: 'FINAL', active: true },
        { id: 4, name: 'Dee',  alpha: 5,  beta: 20, gamma: 5,  grade: 'LOW', state: 'FINAL', active: true },
        { id: 5, name: 'Eve',  alpha: 2,  beta: 10, gamma: 2,  grade: 'LOW', state: 'FINAL', active: true },
        { id: 9, name: 'Hela', alpha: 3,  beta: 50, gamma: 3,  grade: 'LOW', state: 'FINAL', active: true, hold: true },
      ],
    });
    await page.goto('/');
    const rank = (id: number) => page.getByTestId(`person-row-${id}`).getByTestId('concept-rank');
    const pct = (id: number) => page.getByTestId(`person-row-${id}`).getByTestId('concept-percentile');
    const overall = (id: number) => page.getByTestId(`person-row-${id}`).getByTestId('concept-rank-global');

    // by momentum: Ann and Bob 300 -> 1, Cyd 200 -> 2, Dee 100 -> 3, Eve 20 -> 4, Sol 10 -> 5
    await expect(rank(1)).toHaveText('1');
    await expect(rank(2)).toHaveText('1');
    await expect(rank(3)).toHaveText('2');
    await expect(rank(4)).toHaveText('3');
    await expect(rank(5)).toHaveText('4');
    await expect(rank(8)).toHaveText('5');
    await expect(rank(9)).toHaveText('n/a');
    // lowest rank 5: (5 - rank) * 100 / 4 -> 100, 100, 75, 50, 25, 0
    await expect(pct(1)).toHaveText('100');
    await expect(pct(2)).toHaveText('100');
    await expect(pct(3)).toHaveText('75');
    await expect(pct(4)).toHaveText('50');
    await expect(pct(5)).toHaveText('25');
    await expect(pct(8)).toHaveText('0');
    // by value: Ann and Bob 900 -> 1, Cyd 400 -> 2, Dee 200 -> 3, Eve 20 -> 4, Sol 10 -> 5
    await expect(overall(1)).toHaveText('1');
    await expect(overall(2)).toHaveText('1');
    await expect(overall(3)).toHaveText('2');
    await expect(overall(5)).toHaveText('4');
    await expect(overall(8)).toHaveText('5');
    // rank 1 is shared, so both lead
    await expect(page.getByTestId('rollup-leader')).toHaveText('Ann, Bob');

    // as of 2026-04-01 Eve's change counts: alpha 2, beta 50 -> momentum 100, level with Dee at rank 3,
    // so Sol moves up to 4
    await page.getByTestId('sheet-as-of').fill('2026-04-01');
    await page.getByTestId('sheet-as-of-apply').click();
    await expect(rank(5)).toHaveText('3');
    await expect(rank(8)).toHaveText('4');
  });

  test('when everyone is level, everyone is rank 1 and percentile 100', { tag: '@functionality' }, async ({ page }) => {
    // Ann, Bob and Sol all have momentum 300. Cyd is on hold (momentum 200): counted, Cyd would be rank 2
    // with percentile 0, and the others would stay at 1 and 100.
    // Sol is shared from sheet S9: ranked here like anyone, level with Ann and Bob.
    // A change dated after the anchor does not count yet: Bob's beta 10 from 2026-04-01 (momentum 150,
    // which would put him at rank 2).
    await resetAndSeed({
      anchor: '2026-03-01',
      sheets: [
        { id: 'S9', people: [
          { id: 1, name: 'Sol', alpha: 10, beta: 30, gamma: 10, grade: 'LOW', state: 'FINAL', active: true },
        ] },
      ],
      shares: [{ personId: 8, fromSheetId: 'S9', fromPersonId: 1 }],
      history: [{ personId: 2, field: 'beta', value: 10, from: '2026-04-01' }],
      people: [
        { id: 1, name: 'Ann', alpha: 10, beta: 30, gamma: 10, grade: 'LOW', state: 'FINAL', active: true },
        { id: 2, name: 'Bob', alpha: 15, beta: 20, gamma: 15, grade: 'LOW', state: 'FINAL', active: true },
        { id: 3, name: 'Cyd', alpha: 10, beta: 20, gamma: 10, grade: 'LOW', state: 'FINAL', active: true, hold: true },
      ],
    });
    await page.goto('/');
    await expect(page.getByTestId('person-row-1').getByTestId('concept-rank')).toHaveText('1');
    await expect(page.getByTestId('person-row-2').getByTestId('concept-rank')).toHaveText('1');
    await expect(page.getByTestId('person-row-2').getByTestId('concept-percentile')).toHaveText('100');
    await expect(page.getByTestId('person-row-8').getByTestId('concept-rank')).toHaveText('1');
    await expect(page.getByTestId('person-row-8').getByTestId('concept-percentile')).toHaveText('100');
    await expect(page.getByTestId('person-row-3').getByTestId('concept-percentile')).toHaveText('n/a');
  });
});
