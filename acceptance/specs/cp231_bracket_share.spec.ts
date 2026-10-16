import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

test.describe('bracket share', () => {
  test('quartile counts as percent', { tag: '@functionality' }, async ({ page }) => {
    // Quartiles by value: Q4 800 or more, Q3 200 or more, Q2 50 or more, Q1 below.
    // The sheet multiplies band B by 2 (not 3): Ben 300 x 2 = 600 drops to Q3.
    // Sol is shared from sheet S9 as row 8: counted here like anyone (alpha 4, beta 1, gamma 0:
    // momentum -8, band E -> 0, Q1).
    await resetAndSeed({
      settings: { bandMultipliers: { A: 4, B: 2, C: 2, D: 1, E: 0 } },
      people: [
        { id: 1, name: 'Ada', alpha: 10, beta: 50, gamma: 10, grade: 'HIGH', state: 'FINAL', active: true },
        { id: 2, name: 'Ben', alpha: 10, beta: 30, gamma: 10, grade: 'MID', state: 'FINAL', active: true },
        { id: 3, name: 'Cam', alpha: 10, beta: 20, gamma: 10, grade: 'LOW', state: 'REVIEW', active: true },
        { id: 4, name: 'Dot', alpha: 4, beta: 30, gamma: 4, grade: 'HIGH', state: 'DRAFT', active: true },
        { id: 5, name: 'Eli', alpha: 8, beta: 10, gamma: 8, grade: 'MID', state: 'DRAFT', active: true },
        { id: 6, name: 'Fin', alpha: 2, beta: 30, gamma: 2, grade: 'LOW', state: 'REVIEW', active: true },
        { id: 7, name: 'Gwe', alpha: 5, beta: 1, gamma: 0, grade: 'HIGH', state: 'DRAFT', active: true },
        // Hela is on hold (scaled 2400, Q4): left out of every count, so the shares are of the eight others
        { id: 9, name: 'Hela', alpha: 10, beta: 60, gamma: 10, grade: 'HIGH', state: 'FINAL', active: true, hold: true },
      ],
      sheets: [
        { id: 'S9', people: [
          { id: 1, name: 'Sol', alpha: 4, beta: 1, gamma: 0, grade: 'LOW', state: 'DRAFT', active: true },
        ] },
      ],
      shares: [{ personId: 8, fromSheetId: 'S9', fromPersonId: 1, state: 'DRAFT' }],
    });
    await page.goto('/');
    // 8 counted: Q4 Ada 1 x 100 / 8 = 12; Q3 Ben 600, Cam 400, Dot 240: 3 x 100 / 8 = 37;
    // Q2 Eli, Fin 2 x 100 / 8 = 25; Q1 Gwe, Sol 2 x 100 / 8 = 25
    await expect(page.getByTestId('bracket-share-Q4')).toHaveText('12');
    await expect(page.getByTestId('bracket-share-Q3')).toHaveText('37');
    await expect(page.getByTestId('bracket-share-Q2')).toHaveText('25');
    await expect(page.getByTestId('bracket-share-Q1')).toHaveText('25');
  });
});
