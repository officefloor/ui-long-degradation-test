import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// Everyone level at the top is named: the names joined by ", " in alphabetical order. Level means the
// same value of the figure compared; the earlier tie-breaks (name first, the higher alpha for the
// leader) no longer pick one. The runner-up is everyone level at the next value below the top, and the
// gap is the top value minus that next value. Nobody has patrons, follows or a score, so effective,
// influence and adjusted all equal momentum, and value (scaled) is momentum times the band multiplier
// (D 0..99 x1, C 100..249 x2, B 250..499 x3, A 500+ x4).
//   Ann  alpha 10, beta 30: momentum 300, influence 300, band B -> value 900
//   Bob  alpha 15, beta 20: momentum 300, influence 300, value 900 (higher alpha, once the leader)
//   Cyd  alpha 10, beta 20: momentum 200, band C -> value 400
//   Dee  alpha 5, beta 40:  momentum 200, value 400
//   Eve  alpha 2, beta 10:  momentum 20, band D -> value 20
// Hela is on hold: left out of every top name (counted, her momentum 300 and top value would add her
// to each list at the top).
test.describe('ties at the top are listed', () => {
  test('leader, top influence, apex, runner-up and gap list everyone level', { tag: '@functionality' }, async ({ page }) => {
    // the sheet's own band B multiplier is 5, so Ann and Bob's value is 300*5 = 1500
    // Sol is shared from sheet S9: counted here like anyone (momentum 200, value 400, level with Cyd and Dee)
    // a change dated after the anchor does not count yet (Cyd's beta 30 from 2026-04-01)
    await resetAndSeed({
      anchor: '2026-03-01',
      settings: { bandMultipliers: { B: 5 } },
      sheets: [
        { id: 'S9', people: [{ id: 1, name: 'Sol', alpha: 4, beta: 50, gamma: 4, grade: 'LOW', state: 'FINAL', active: true }] },
      ],
      shares: [{ personId: 8, fromSheetId: 'S9', fromPersonId: 1 }],
      history: [{ personId: 3, field: 'beta', value: 30, from: '2026-04-01' }],
      people: [
        { id: 1, name: 'Ann',  alpha: 10, beta: 30, gamma: 10, grade: 'LOW', state: 'FINAL', active: true },
        { id: 2, name: 'Bob',  alpha: 15, beta: 20, gamma: 15, grade: 'LOW', state: 'FINAL', active: true },
        { id: 3, name: 'Cyd',  alpha: 10, beta: 20, gamma: 10, grade: 'LOW', state: 'FINAL', active: true },
        { id: 4, name: 'Dee',  alpha: 5,  beta: 40, gamma: 5,  grade: 'LOW', state: 'FINAL', active: true },
        { id: 5, name: 'Eve',  alpha: 2,  beta: 10, gamma: 2,  grade: 'LOW', state: 'FINAL', active: true },
        { id: 9, name: 'Hela', alpha: 6,  beta: 50, gamma: 6,  grade: 'LOW', state: 'FINAL', active: true, hold: true },
      ],
    });
    await page.goto('/');

    // momentum 300 for Ann and Bob: both lead (by alpha alone it would be Bob)
    await expect(page.getByTestId('rollup-leader')).toHaveText('Ann, Bob');
    await expect(page.getByTestId('rollup-top-influence')).toHaveText('Ann, Bob');
    await expect(page.getByTestId('rollup-strongest-member')).toHaveText('Ann, Bob');
    await expect(page.getByTestId('rollup-apexname')).toHaveText('Ann, Bob');
    // the next value below 1500 is 400, held by Cyd, Dee and Sol
    await expect(page.getByTestId('rollup-runnerup')).toHaveText('Cyd, Dee, Sol');
    // gap 1500 - 400 = 1100 (the second in line, Bob, would give 0)
    await expect(page.getByTestId('rollup-gapval')).toHaveText('1100');
  });

  test('everyone level at the top leaves no runner-up', { tag: '@functionality' }, async ({ page }) => {
    // Ann, Bob and Sol are level at 900 and alone on the sheet: no value below the top, so the runner-up
    // and the gap are n/a. Cyd is on hold: counted, Cyd would be the runner-up at 400, gap 500.
    // Sol is shared from sheet S9: counted here like anyone (value 900, level at the top)
    // a change dated after the anchor does not count yet (Bob's beta 10 from 2026-04-01)
    await resetAndSeed({
      anchor: '2026-03-01',
      sheets: [
        { id: 'S9', people: [{ id: 1, name: 'Sol', alpha: 5, beta: 60, gamma: 5, grade: 'LOW', state: 'FINAL', active: true }] },
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
    await expect(page.getByTestId('rollup-apexname')).toHaveText('Ann, Bob, Sol');
    await expect(page.getByTestId('rollup-runnerup')).toHaveText('n/a');
    await expect(page.getByTestId('rollup-gapval')).toHaveText('n/a');
  });
});
