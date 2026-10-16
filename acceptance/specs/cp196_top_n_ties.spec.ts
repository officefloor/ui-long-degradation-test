import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// A figure that takes the top N people by value also takes everyone level with the last person
// inside the cut-off. Nobody has patrons, follows or a score, so value (scaled) is momentum times the
// band multiplier (D 0..99 x1, C 100..249 x2, B 250..499 x3).
//   Ann alpha 10, beta 30: momentum 300, band B -> value 900
//   Bob alpha 10, beta 20: momentum 200, band C -> value 400 (Cyd and Dee the same)
//   Eve alpha 2,  beta 10: momentum 20,  band D -> value 20
test.describe('top N takes ties at the cut-off', () => {
  test('the top three and the top two share take everyone level at the cut-off', { tag: '@functionality' }, async ({ page }) => {
    // Hela is on hold: never taken, counted at half in the whole total. Her value is 400 (momentum
    // 200, band C); counted, she would join the level people at both cut-offs.
    // top three: Ann 900, then Bob, Cyd, Dee, Sol level at 400 (the third is Cyd; Dee and Sol are
    // level with him)
    // top two: Ann 900 and Bob 400, plus Cyd, Dee and Sol level with Bob: 900 + 4*400 = 2500
    // whole total: 900 + 400 + 400 + 400 + 400 + 20 + 400/2 = 2720; 2500 * 100 / 2720 = 91.9 -> 91
    // (cutting at two would give 1300 * 100 / 2720 = 47)
    // Sol is shared from sheet S9: counted here like anyone (momentum 200, value 400, level with Bob)
    // a change dated after the anchor does not count yet (Eve's beta 100 from 2026-04-01)
    await resetAndSeed({
      anchor: '2026-03-01',
      sheets: [
        { id: 'S9', people: [{ id: 1, name: 'Sol', alpha: 5, beta: 40, gamma: 5, grade: 'LOW', state: 'FINAL', active: true }] },
      ],
      shares: [{ personId: 8, fromSheetId: 'S9', fromPersonId: 1 }],
      history: [{ personId: 5, field: 'beta', value: 100, from: '2026-04-01' }],
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
    await expect(page.getByTestId('rollup-topset')).toHaveText('Ann, Bob, Cyd, Dee, Sol');
    await expect(page.getByTestId('rollup-concentration')).toHaveText('91');
  });

  test('a tie inside the cut-off takes no one extra', { tag: '@functionality' }, async ({ page }) => {
    // Ann and Bob are level at 1200, inside both cut-offs; Cyd (400) is not level with the last one in.
    // top three: Ann, Bob, Cyd; top two: 1200 + 1200 = 2400
    // whole total: 1200 + 1200 + 400 + 20 + Sol 20 + 400/2 = 3040; 2400 * 100 / 3040 = 78.9 -> 78
    // Hela is on hold (value 400): counted, she would join Cyd at the third place.
    // the sheet's own band B multiplier is 4: Ann and Bob's value is 300*4 = 1200
    // Sol is shared from sheet S9: counted here like anyone (momentum 20, value 20)
    // a change dated after the anchor does not count yet (Cyd's beta 40 from 2026-04-01)
    await resetAndSeed({
      anchor: '2026-03-01',
      settings: { bandMultipliers: { B: 4 } },
      sheets: [
        { id: 'S9', people: [{ id: 1, name: 'Sol', alpha: 2, beta: 10, gamma: 2, grade: 'LOW', state: 'FINAL', active: true }] },
      ],
      shares: [{ personId: 8, fromSheetId: 'S9', fromPersonId: 1 }],
      history: [{ personId: 3, field: 'beta', value: 40, from: '2026-04-01' }],
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
