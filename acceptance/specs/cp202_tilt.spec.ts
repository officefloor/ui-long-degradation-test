import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

test.describe('tilt', () => {
  test('above-mean minus below-mean', { tag: '@functionality' }, async ({ page }) => {
    // Hela is on hold: she still shows on the list, but is left out of sheet-wide figures (counted at half in totals).
    // Sol is shared from sheet S9: counted here like anyone (momentum 300, band B -> 900).
    // Average without her (2000+900+900+400+240+80+60+0) / 8 = 4580 / 8 = 572: above Ada, Ben, Sol (3);
    // below the other five (5) -> 3 - 5 = -2.
    // Counting her (average 4580 / 9 = 508, six below) would give -3.
    await resetAndSeed({
      sheets: [
        { id: 'S9', people: [
          { id: 1, name: 'Sol', alpha: 10, beta: 30, gamma: 10, grade: 'MID', state: 'DRAFT', active: true },
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
        { id: 9, name: 'Hela', alpha: 5, beta: 1, gamma: 1, grade: 'LOW', state: 'DRAFT', active: true, hold: true }, // momentum 5 + 3 x (1 - 5) = -7 -> band E x0 -> scaled 0
      ],
    });
    await page.goto('/');
    await expect(page.getByTestId('rollup-tilt')).toHaveText('-2');
  });
});
