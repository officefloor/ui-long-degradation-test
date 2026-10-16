import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

test.describe('skew value', () => {
  test('mean minus median', { tag: '@functionality' }, async ({ page }) => {
    // Hela is on hold: she still shows on the list, but is left out of sheet-wide figures (counted at half in totals).
    // The sheet's own band multiplier for D is 2 (default 1): Eli 80 x 2 = 160, Fin 60 x 2 = 120, Sol 30 x 2 = 60.
    // Sol is shared from sheet S9: counted here like anyone (momentum 3 x 10 = 30, band D -> 60).
    // A change dated after the anchor does not count yet (Ada's beta 10 from 2026-04-01).
    // Values: 2000, 900, 400, 240, 160, 120, 60, 0 -> average 3880 / 8 = 485, middle (lower of 160 and 240) 160
    // -> 485 - 160 = 325.
    // Counting Hela would give 3880 / 9 = 431 and middle 160 -> 271.
    await resetAndSeed({
      anchor: '2026-03-01',
      settings: { bandMultipliers: { A: 4, B: 3, C: 2, D: 2, E: 0 } },
      sheets: [
        { id: 'S9', people: [
          { id: 1, name: 'Sol', alpha: 3, beta: 10, gamma: 3, grade: 'LOW', state: 'DRAFT', active: true },
        ] },
      ],
      shares: [{ personId: 8, fromSheetId: 'S9', fromPersonId: 1 }],
      history: [{ personId: 1, field: 'beta', value: 10, from: '2026-04-01' }],
      people: [
        { id: 1, name: 'Ada', alpha: 10, beta: 50, gamma: 10, grade: 'HIGH', state: 'FINAL', active: true },
        { id: 2, name: 'Ben', alpha: 10, beta: 30, gamma: 10, grade: 'MID', state: 'FINAL', active: true },
        { id: 3, name: 'Cam', alpha: 10, beta: 20, gamma: 10, grade: 'LOW', state: 'REVIEW', active: true },
        { id: 4, name: 'Dot', alpha: 4, beta: 30, gamma: 4, grade: 'HIGH', state: 'DRAFT', active: true },
        { id: 5, name: 'Eli', alpha: 8, beta: 10, gamma: 8, grade: 'MID', state: 'DRAFT', active: true },
        { id: 6, name: 'Fin', alpha: 2, beta: 30, gamma: 2, grade: 'LOW', state: 'REVIEW', active: true },
        { id: 7, name: 'Gwe', alpha: 5, beta: 1, gamma: 0, grade: 'HIGH', state: 'DRAFT', active: true },
        { id: 9, name: 'Hela', alpha: 5, beta: 1, gamma: 1, grade: 'LOW', state: 'DRAFT', active: true, hold: true }, // momentum 5 + 3 x (1 - 5) = -7 -> band E x0 -> scaled 0
      ],
    });
    await page.goto('/');
    await expect(page.getByTestId('rollup-skewval')).toHaveText('325');

    // as of 2026-04-01 Ada's change counts: momentum 100, band C -> 200; values 900, 400, 240, 200, 160,
    // 120, 60, 0 -> average 2080 / 8 = 260, middle 160 -> 100
    await page.getByTestId('sheet-as-of').fill('2026-04-01');
    await page.getByTestId('sheet-as-of-apply').click();
    await expect(page.getByTestId('rollup-skewval')).toHaveText('100');
  });
});
