import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// A figure that takes the top N people by value also takes everyone level with the last person
// inside the cut-off. Nobody has patrons, follows or a score, so value (scaled) is momentum times the
// band multiplier. The sheet's own multiplier for band D is 2 (default 1): D 0..99 x2, C 100..249 x2,
// B 250..499 x3.
//   Ann alpha 10, beta 30: momentum 300, band B -> value 900
//   Bob alpha 10, beta 20: momentum 200, band C -> value 400 (Cyd and Dee the same)
//   Eve alpha 2,  beta 10: momentum 20,  band D -> value 40
//   Sol alpha 3,  beta 10: momentum 30,  band D -> value 60
// Sol is shared from sheet S9: counted here like anyone.
// A change dated after the anchor does not count yet (Eve's beta 50 from 2026-04-01 would make her
// momentum 100, value 200).
test.describe('top N takes ties at the cut-off', () => {
  test('the top three and the top two share take everyone level at the cut-off', { tag: '@functionality' }, async ({ page }) => {
    // Hela is on hold: never taken, and a percentage's whole takes only the people who count, so she
    // adds nothing to it. Her value is 400 (momentum 200, band C); counted, she would join the level
    // people at both cut-offs.
    // top three: Ann 900, then Bob, Cyd, Dee level at 400 (the third is Cyd; Dee is level with him)
    // top two: Ann 900 and Bob 400, plus Cyd and Dee level with Bob: 900 + 3*400 = 2100
    // whole: 900 + 400 + 400 + 400 + 60 + 40 = 2200; 2100 * 100 / 2200 = 95.5 -> 95
    // (cutting at two would give 1300 * 100 / 2200 = 59)
    await resetAndSeed({
      anchor: '2026-03-01',
      settings: { bandMultipliers: { A: 4, B: 3, C: 2, D: 2, E: 0 } },
      sheets: [
        { id: 'S9', people: [
          { id: 1, name: 'Sol', alpha: 3, beta: 10, gamma: 3, grade: 'LOW', state: 'FINAL', active: true },
        ] },
      ],
      shares: [{ personId: 8, fromSheetId: 'S9', fromPersonId: 1 }],
      history: [{ personId: 5, field: 'beta', value: 50, from: '2026-04-01' }],
      people: [
        { id: 1, name: 'Ann',  alpha: 10, beta: 30, gamma: 10, grade: 'LOW', state: 'FINAL', active: true },
        { id: 2, name: 'Bob',  alpha: 10, beta: 20, gamma: 10, grade: 'LOW', state: 'FINAL', active: true },
        { id: 3, name: 'Cyd',  alpha: 10, beta: 20, gamma: 10, grade: 'LOW', state: 'FINAL', active: true },
        { id: 4, name: 'Dee',  alpha: 5,  beta: 40, gamma: 5,  grade: 'LOW', state: 'FINAL', active: true },
        { id: 5, name: 'Eve',  alpha: 2,  beta: 10, gamma: 2,  grade: 'LOW', state: 'FINAL', active: true },
        { id: 9, name: 'Hela', alpha: 4,  beta: 50, gamma: 4,  grade: 'LOW', state: 'FINAL', active: true, hold: true },
      ],
    });
    await page.goto('/');
    await expect(page.getByTestId('rollup-topset')).toHaveText('Ann, Bob, Cyd, Dee');
    await expect(page.getByTestId('rollup-concentration')).toHaveText('95');
  });

  test('a tie inside the cut-off takes no one extra', { tag: '@functionality' }, async ({ page }) => {
    // Ann and Bob are level at 900, inside both cut-offs; Cyd (400) is not level with the last one in.
    // top three: Ann, Bob, Cyd; top two: 900 + 900 = 1800
    // whole: 900 + 900 + 400 + 60 + 40 = 2300 (Hela adds nothing); 1800 * 100 / 2300 = 78.3 -> 78
    // Hela is on hold (value 400): counted, she would join Cyd at the third place.
    await resetAndSeed({
      anchor: '2026-03-01',
      settings: { bandMultipliers: { A: 4, B: 3, C: 2, D: 2, E: 0 } },
      sheets: [
        { id: 'S9', people: [
          { id: 1, name: 'Sol', alpha: 3, beta: 10, gamma: 3, grade: 'LOW', state: 'FINAL', active: true },
        ] },
      ],
      shares: [{ personId: 8, fromSheetId: 'S9', fromPersonId: 1 }],
      history: [{ personId: 5, field: 'beta', value: 50, from: '2026-04-01' }],
      people: [
        { id: 1, name: 'Ann',  alpha: 10, beta: 30, gamma: 10, grade: 'LOW', state: 'FINAL', active: true },
        { id: 2, name: 'Bob',  alpha: 15, beta: 20, gamma: 15, grade: 'LOW', state: 'FINAL', active: true },
        { id: 3, name: 'Cyd',  alpha: 10, beta: 20, gamma: 10, grade: 'LOW', state: 'FINAL', active: true },
        { id: 5, name: 'Eve',  alpha: 2,  beta: 10, gamma: 2,  grade: 'LOW', state: 'FINAL', active: true },
        { id: 9, name: 'Hela', alpha: 4,  beta: 50, gamma: 4,  grade: 'LOW', state: 'FINAL', active: true, hold: true },
      ],
    });
    await page.goto('/');
    await expect(page.getByTestId('rollup-topset')).toHaveText('Ann, Bob, Cyd');
    await expect(page.getByTestId('rollup-concentration')).toHaveText('78');
  });
});
