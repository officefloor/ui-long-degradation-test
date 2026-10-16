import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

test.describe('stratum counts', () => {
  test('counts top and bottom', { tag: '@functionality' }, async ({ page }) => {
    // Hela is on hold: she still shows on the list, but is left out of sheet-wide figures and is not counted.
    // Sol is shared from sheet S9: counted here like anyone (momentum 3 x 10 = 30, band D -> 30).
    // Values without her: 0, 30, 60, 80, 240, 400, 900, 2000 -> middle (lower of 80 and 240) 80:
    // TOP Ada, Ben, Cam, Dot, Eli (5); BOT Fin, Sol, Gwe (3).
    // Counting her 0 (middle still 80) would give BOT 4.
    // A change dated after the anchor does not count yet: Eli's beta 0 from 2026-04-01 would make his
    // momentum 0, leaving him out of the counts (BOT 2).
    await resetAndSeed({
      anchor: '2026-03-01',
      history: [{ personId: 5, field: 'beta', value: 0, from: '2026-04-01' }],
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
        { id: 9, name: 'Hela', alpha: 5, beta: 1, gamma: 1, grade: 'LOW', state: 'DRAFT', active: true, hold: true }, // momentum 5 + 3 x (1 - 5) = -7 -> band E x0 -> scaled 0
      ],
    });
    await page.goto('/');
    await expect(page.getByTestId('stratum-count-TOP')).toHaveText('5');
    await expect(page.getByTestId('stratum-count-BOT')).toHaveText('3');
  });
});
