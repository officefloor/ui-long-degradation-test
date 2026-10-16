import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

test.describe('coverage share', () => {
  test('coverage as percent of headcount', { tag: '@functionality' }, async ({ page }) => {
    // Hela is on hold: she still shows on the list, but is left out of sheet-wide figures and is not counted.
    // The sheet's own band multiplier for D is 2 (default 1): Eli 80 x 2 = 160, Fin 60 x 2 = 120, Sol 30 x 2 = 60.
    // Sol is shared from sheet S9: counted here like anyone (momentum 3 x 10 = 30, band D).
    // Value of at least 100 without her: Ada, Ben, Cam, Dot, Eli, Fin = 6 of 8 people -> 6 x 100 / 8 = 75
    // (Sol 60 and Gwe 0 are below). Counting her would give 7 of 9 -> 77.
    await resetAndSeed({
      settings: { bandMultipliers: { A: 4, B: 3, C: 2, D: 2, E: 0 } },
      sheets: [
        { id: 'S9', people: [
          { id: 1, name: 'Sol', alpha: 3, beta: 10, gamma: 3, grade: 'LOW', state: 'DRAFT', active: true },
        ] },
      ],
      shares: [{ personId: 8, fromSheetId: 'S9', fromPersonId: 1 }],
      people: [
        { id: 1, name: 'Ada', alpha: 10, beta: 50, gamma: 10, grade: 'HIGH', state: 'FINAL', active: true },
        { id: 2, name: 'Ben', alpha: 10, beta: 30, gamma: 10, grade: 'MID', state: 'FINAL', active: true },
        { id: 3, name: 'Cam', alpha: 10, beta: 20, gamma: 10, grade: 'LOW', state: 'REVIEW', active: true },
        { id: 4, name: 'Dot', alpha: 4, beta: 30, gamma: 4, grade: 'HIGH', state: 'DRAFT', active: true },
        { id: 5, name: 'Eli', alpha: 8, beta: 10, gamma: 8, grade: 'MID', state: 'DRAFT', active: true },
        { id: 6, name: 'Fin', alpha: 2, beta: 30, gamma: 2, grade: 'LOW', state: 'REVIEW', active: true },
        { id: 7, name: 'Gwe', alpha: 5, beta: 1, gamma: 0, grade: 'HIGH', state: 'DRAFT', active: true },
        { id: 9, name: 'Hela', alpha: 10, beta: 60, gamma: 10, grade: 'LOW', state: 'DRAFT', active: true, hold: true }, // momentum 600 -> band A x4 -> scaled 2400
      ],
    });
    await page.goto('/');
    await expect(page.getByTestId('rollup-coverage-share')).toHaveText('75');
  });
});
