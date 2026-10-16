import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// Every percentage is taken over the people who count (not on hold, momentum not 0) on both sides:
// someone who does not count adds nothing to the part or to the whole, and a person on hold no longer
// adds half to the whole. Figures that are not percentages keep everyone as before. Nobody has
// patrons or follows, so adjusted = momentum + score and value (scaled) is adjusted times the band
// multiplier (D 0..99 x1, C 100..249 x2, B 250..499 x3).
//   Ann alpha 10, beta 30: momentum 300, band B -> value 900
//   Zed alpha 4, beta 3, gamma 0: momentum 12 - 12 = 0; score 250 -> adjusted 250, band B -> value 750
//   Ben alpha 10, beta 20: momentum 200, band C -> value 400
//   Eve alpha 2, beta 10: momentum 20, band D -> value 20
// Hela is on hold: value 200 (momentum 100, band C); she adds nothing to a percentage.
test.describe('percentages are of the people who count', () => {
  test('the top two share leaves out momentum 0 and people on hold entirely', { tag: '@functionality' }, async ({ page }) => {
    // The sheet's own band multiplier for D is 2 (default 1): Eve 20 x 2 = 40, Sol 30 x 2 = 60.
    // Sol is shared from sheet S9: counted here like anyone (alpha 3, beta 10: momentum 30, band D -> value 60)
    // A change dated after the anchor does not count yet (Eve's beta 50 from 2026-04-01).
    await resetAndSeed({
      anchor: '2026-03-01',
      settings: { bandMultipliers: { A: 4, B: 3, C: 2, D: 2, E: 0 } },
      history: [{ personId: 4, field: 'beta', value: 50, from: '2026-04-01' }],
      sheets: [
        { id: 'S9', people: [
          { id: 1, name: 'Sol', alpha: 3, beta: 10, gamma: 3, score: 0, grade: 'LOW', state: 'FINAL', active: true },
        ] },
      ],
      shares: [{ personId: 8, fromSheetId: 'S9', fromPersonId: 1 }],
      people: [
        { id: 1, name: 'Ann',  alpha: 10, beta: 30, gamma: 10, score: 0,   grade: 'LOW', state: 'FINAL', active: true },
        { id: 2, name: 'Zed',  alpha: 4,  beta: 3,  gamma: 0,  score: 250, grade: 'LOW', state: 'FINAL', active: true },
        { id: 3, name: 'Ben',  alpha: 10, beta: 20, gamma: 10, score: 0,   grade: 'LOW', state: 'FINAL', active: true },
        { id: 4, name: 'Eve',  alpha: 2,  beta: 10, gamma: 2,  score: 0,   grade: 'LOW', state: 'FINAL', active: true },
        { id: 9, name: 'Hela', alpha: 5,  beta: 20, gamma: 5,  score: 0,   grade: 'LOW', state: 'FINAL', active: true, hold: true },
      ],
    });
    await page.goto('/');
    await expect(page.getByTestId('person-row-2').getByTestId('concept-momentum')).toHaveText('0');
    // people who count: Ann 900, Ben 400, Sol 60, Eve 40. Top two: 900 + 400 = 1300 of
    // 900 + 400 + 60 + 40 = 1400 -> 1300 * 100 / 1400 = 92.9 -> 92 (rounded down). Taking Zed into the
    // top two and Hela at half into the whole would give (900 + 750) * 100 / (900 + 750 + 400 + 60 + 40 + 100) = 73.
    await expect(page.getByTestId('rollup-concentration')).toHaveText('92');
    // not percentages: the top three names still take Zed, and Zed still has a percentile
    await expect(page.getByTestId('rollup-topset')).toHaveText('Ann, Zed, Ben');
    // rank by momentum: Ann 300, Ben 200, Sol 30, Eve 20, Zed 0 -> Zed 5th of 5 -> percentile 0
    await expect(page.getByTestId('person-row-2').getByTestId('concept-percentile')).toHaveText('0');
    await expect(page.getByTestId('person-row-3').getByTestId('concept-percentile')).toHaveText('75'); // (5-2)*100/4 = 75
  });

  test('putting someone on hold takes them out of both sides', { tag: '@functionality' }, async ({ page }) => {
    // The sheet's own band multiplier for D is 2 (default 1): Eve 20 x 2 = 40, Sol 30 x 2 = 60.
    // Sol is shared from sheet S9: counted here like anyone (alpha 3, beta 10: momentum 30, band D).
    // A change dated after the anchor does not count yet (Eve's beta 50 from 2026-04-01).
    // Before: Ann 900, Ben 400, Sol 60, Eve 40 count; Hela (value 200) is on hold:
    //   top two 900 + 400 = 1300 of 1400 -> 92.9 -> 92.
    // Taking Hela off hold: top two 900 + 400 = 1300 of 1400 + 200 = 1600 -> 81.25 -> 81.
    // Putting Ben on hold: top two Ann 900 and Hela 200 = 1100 of 900 + 60 + 40 + 200 = 1200 -> 91.7 -> 91.
    await resetAndSeed({
      anchor: '2026-03-01',
      settings: { bandMultipliers: { A: 4, B: 3, C: 2, D: 2, E: 0 } },
      sheets: [
        { id: 'S9', people: [
          { id: 1, name: 'Sol', alpha: 3, beta: 10, gamma: 3, score: 0, grade: 'LOW', state: 'FINAL', active: true },
        ] },
      ],
      shares: [{ personId: 8, fromSheetId: 'S9', fromPersonId: 1 }],
      history: [{ personId: 4, field: 'beta', value: 50, from: '2026-04-01' }],
      people: [
        { id: 1, name: 'Ann',  alpha: 10, beta: 30, gamma: 10, score: 0, grade: 'LOW', state: 'FINAL', active: true },
        { id: 3, name: 'Ben',  alpha: 10, beta: 20, gamma: 10, score: 0, grade: 'LOW', state: 'FINAL', active: true },
        { id: 4, name: 'Eve',  alpha: 2,  beta: 10, gamma: 2,  score: 0, grade: 'LOW', state: 'FINAL', active: true },
        { id: 9, name: 'Hela', alpha: 5,  beta: 20, gamma: 5,  score: 0, grade: 'LOW', state: 'FINAL', active: true, hold: true },
      ],
    });
    await page.goto('/');
    await expect(page.getByTestId('rollup-concentration')).toHaveText('92');
    await page.getByTestId('person-hold-9').click();
    await expect(page.getByTestId('rollup-concentration')).toHaveText('81');
    await page.getByTestId('person-hold-3').click();
    await expect(page.getByTestId('rollup-concentration')).toHaveText('91');
  });
});
