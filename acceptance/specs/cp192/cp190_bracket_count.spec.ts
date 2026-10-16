import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

test.describe('bracket counts', () => {
  test('counts per quartile', { tag: '@functionality' }, async ({ page }) => {
    // Hela is on hold: left out of sheet-wide figures, counted at half in totals. Her scaled is
    // 2400 (thrust 600, drift 0, band A x4); counted, Q4 would hold 3.
    // the sheet's own band D multiplier is 4: Eli 80*4 = 320 and Fin 60*4 = 240
    // Sol is shared from sheet S9: counted here like anyone (momentum 200, band C x2 -> value 400)
    await resetAndSeed({
      settings: { bandMultipliers: { D: 4 } },
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
    // Q4 Ada 2000, Ben 900; Q3 Cam 400, Dot 240, Eli 320, Fin 240, Sol 400; Q2 none; Q1 Gwe 0
    await expect(page.getByTestId('bracket-count-Q4')).toHaveText('2');
    await expect(page.getByTestId('bracket-count-Q3')).toHaveText('5');
    await expect(page.getByTestId('bracket-count-Q2')).toHaveText('0');
    await expect(page.getByTestId('bracket-count-Q1')).toHaveText('1');
  });
});
