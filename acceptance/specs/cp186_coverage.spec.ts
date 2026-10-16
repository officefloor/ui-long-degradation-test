import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

test.describe('coverage', () => {
  test('counts people at or above 100', { tag: '@functionality' }, async ({ page }) => {
    // Hela is on hold: left out of sheet-wide figures, counted at half in totals. Her scaled is
    // 2400 (thrust 600, drift 0, band A x4); counted, coverage would be 8.
    // Ada 2000, Ben 900, Cam 400, Dot 240, Eli 160, Fin 120 and Sol 400 reach 100: coverage 7.
    // the sheet's own band D multiplier is 2: Eli 80*2 = 160 and Fin 60*2 = 120 reach 100
    // Sol is shared from sheet S9: counted here like anyone (momentum 200, band C x2 -> value 400)
    await resetAndSeed({
      settings: { bandMultipliers: { D: 2 } },
      sheets: [
        { id: 'S9', people: [{ id: 1, name: 'Sol', alpha: 10, beta: 20, gamma: 10, grade: 'MID', state: 'FINAL', active: true }] },
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
        { id: 9, name: 'Hela', alpha: 10, beta: 60, gamma: 10, grade: 'HIGH', state: 'FINAL', active: true, hold: true },
      ],
    });
    await page.goto('/');
    await expect(page.getByTestId('rollup-coverage')).toHaveText('7');
  });
});
