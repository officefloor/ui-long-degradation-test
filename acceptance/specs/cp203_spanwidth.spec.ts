import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

test.describe('span width', () => {
  test('distinct bands present', { tag: '@functionality' }, async ({ page }) => {
    // Hela is on hold: she still shows on the list, but is left out of sheet-wide figures (counted at half in totals).
    // Sol is shared from sheet S9: counted here like anyone, and the only one in band B (momentum 300).
    // Bands without her: Ada A, Ben C, Cam C, Dot C, Eli D, Fin D, Gwe D, Sol B -> A, B, C, D = 4.
    // Only Hela is in band E, so counting her would give 5.
    await resetAndSeed({
      sheets: [
        { id: 'S9', people: [
          { id: 1, name: 'Sol', alpha: 10, beta: 30, gamma: 10, grade: 'MID', state: 'DRAFT', active: true },
        ] },
      ],
      shares: [{ personId: 8, fromSheetId: 'S9', fromPersonId: 1 }],
      people: [
        { id: 1, name: 'Ada', alpha: 10, beta: 50, gamma: 10, grade: 'HIGH', state: 'FINAL', active: true },
        { id: 2, name: 'Ben', alpha: 10, beta: 20, gamma: 10, grade: 'MID', state: 'FINAL', active: true }, // momentum 200 -> band C
        { id: 3, name: 'Cam', alpha: 10, beta: 20, gamma: 10, grade: 'LOW', state: 'REVIEW', active: true },
        { id: 4, name: 'Dot', alpha: 4, beta: 30, gamma: 4, grade: 'HIGH', state: 'DRAFT', active: true },
        { id: 5, name: 'Eli', alpha: 8, beta: 10, gamma: 8, grade: 'MID', state: 'DRAFT', active: true },
        { id: 6, name: 'Fin', alpha: 2, beta: 30, gamma: 2, grade: 'LOW', state: 'REVIEW', active: true },
        { id: 7, name: 'Gwe', alpha: 5, beta: 1, gamma: 5, grade: 'HIGH', state: 'DRAFT', active: true }, // momentum 5 -> band D
        { id: 9, name: 'Hela', alpha: 5, beta: 1, gamma: 1, grade: 'LOW', state: 'DRAFT', active: true, hold: true }, // momentum 5 + 3 x (1 - 5) = -7 -> band E x0 -> scaled 0
      ],
    });
    await page.goto('/');
    await expect(page.getByTestId('rollup-spanwidth')).toHaveText('4');
  });
});
