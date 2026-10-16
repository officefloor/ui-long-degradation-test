import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// Every average taken across the sheet becomes the middle value (the lower of the two middle values
// for an even count): the tilt is measured around the middle value, and the average group size
// becomes the middle group size. The lopsidedness still compares the true average (rounded down)
// with the middle value. Nobody has patrons, follows or a score, so value (scaled) is momentum times
// the band multiplier. The sheet's own multiplier for band D is 2 (default 1), so: D 0..99 x2,
// C 100..249 x2, B 250..499 x3. Everyone is FINAL, so every member counts in their group.
// Sol is shared from sheet S9: counted here like anyone (momentum 50, band D -> 100), in no group.
// A change dated after the anchor does not count yet (Ann's beta 10 from 2026-04-01 would make her
// momentum 100, value 200).
//   Ann 900 (momentum 300, B), Ben 400 (200, C), Cyd 200 (100, C), Dee 120 (60), Sol 100 (50),
//   Fay 60 (30), Eve 40 (20)
//   values in order: 40, 60, 100, 120, 200, 400, 900 -> middle 120
//   true average 1820 / 7 = 260
// Groups: North (Ann, Ben, Dee, Eve, and Hela on hold) size 4, South (Cyd) 1, East (Fay) 1.
// Hela is on hold: out of the middle value, the tilt and her group's size. Counted, her 2400 (momentum
// 600, band A) would make the tilt 4 above - 3 below = 1.
test.describe('averages across the sheet become middle values', () => {
  test('tilt and group size use the middle value; lopsidedness keeps the average', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      anchor: '2026-03-01',
      settings: { bandMultipliers: { A: 4, B: 3, C: 2, D: 2, E: 0 } },
      sheets: [
        { id: 'S9', people: [
          { id: 1, name: 'Sol', alpha: 5, beta: 10, gamma: 5, grade: 'LOW', state: 'FINAL', active: true },
        ] },
      ],
      shares: [{ personId: 8, fromSheetId: 'S9', fromPersonId: 1 }],
      history: [{ personId: 1, field: 'beta', value: 10, from: '2026-04-01' }],
      groups: [{ id: 1, name: 'North' }, { id: 2, name: 'South' }, { id: 3, name: 'East' }],
      people: [
        { id: 1, name: 'Ann',  alpha: 10, beta: 30, gamma: 10, grade: 'LOW', state: 'FINAL', active: true },
        { id: 2, name: 'Ben',  alpha: 10, beta: 20, gamma: 10, grade: 'LOW', state: 'FINAL', active: true },
        { id: 3, name: 'Cyd',  alpha: 5,  beta: 20, gamma: 5,  grade: 'LOW', state: 'FINAL', active: true },
        { id: 4, name: 'Dee',  alpha: 2,  beta: 30, gamma: 2,  grade: 'LOW', state: 'FINAL', active: true },
        { id: 5, name: 'Eve',  alpha: 2,  beta: 10, gamma: 2,  grade: 'LOW', state: 'FINAL', active: true },
        { id: 6, name: 'Fay',  alpha: 3,  beta: 10, gamma: 3,  grade: 'LOW', state: 'FINAL', active: true },
        { id: 9, name: 'Hela', alpha: 10, beta: 60, gamma: 10, grade: 'LOW', state: 'FINAL', active: true, hold: true },
      ],
      memberships: [
        { personId: 1, groupId: 1 }, { personId: 2, groupId: 1 }, { personId: 4, groupId: 1 },
        { personId: 5, groupId: 1 }, { personId: 9, groupId: 1 }, { personId: 3, groupId: 2 },
        { personId: 6, groupId: 3 },
      ],
    });
    await page.goto('/');
    // around the middle value 120: above Cyd, Ben, Ann (3), below Sol, Fay, Eve (3) -> 0
    // (around the average 260 it would be 2 - 5 = -3)
    await expect(page.getByTestId('rollup-tilt')).toHaveText('0');
    // group sizes 4, 1, 1: middle 1 (the average would be 6 / 3 = 2)
    await expect(page.getByTestId('rollup-mean-size')).toHaveText('1');
    // lopsidedness: average 260 - middle 120 = 140
    await expect(page.getByTestId('rollup-skewval')).toHaveText('140');
    await expect(page.getByTestId('rollup-median-scaled')).toHaveText('120');
  });
});
