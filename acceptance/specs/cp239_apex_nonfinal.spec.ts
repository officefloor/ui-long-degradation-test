import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

test.describe('top non-final', () => {
  test('apex among non-final', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      people: [
        { id: 1, name: 'Ada', alpha: 10, beta: 50, gamma: 10, grade: 'HIGH', state: 'FINAL', active: true },
        { id: 2, name: 'Ben', alpha: 10, beta: 30, gamma: 10, grade: 'MID', state: 'FINAL', active: true },
        { id: 3, name: 'Cam', alpha: 10, beta: 20, gamma: 10, grade: 'LOW', state: 'REVIEW', active: true },
        { id: 4, name: 'Dot', alpha: 4, beta: 30, gamma: 4, grade: 'HIGH', state: 'DRAFT', active: true },
        { id: 5, name: 'Eli', alpha: 8, beta: 10, gamma: 8, grade: 'MID', state: 'DRAFT', active: true },
        { id: 6, name: 'Fin', alpha: 2, beta: 30, gamma: 2, grade: 'LOW', state: 'REVIEW', active: true },
        { id: 7, name: 'Gwe', alpha: 5, beta: 1, gamma: 0, grade: 'HIGH', state: 'DRAFT', active: true },
        // Hela is on hold (momentum 600, scaled 2400, REVIEW): left out of the top name among the non-final (with her it would be Hela)
        { id: 9, name: 'Hela', alpha: 10, beta: 60, gamma: 10, grade: 'HIGH', state: 'REVIEW', active: true, hold: true },
      ],
      // Sol is shared from sheet S9 as row 8: counted here like anyone (DRAFT here, momentum 250, band B x3 -> 750)
      sheets: [
        { id: 'S9', people: [
          { id: 1, name: 'Sol', alpha: 10, beta: 25, gamma: 10, grade: 'LOW', state: 'DRAFT', active: true },
        ] },
      ],
      shares: [{ personId: 8, fromSheetId: 'S9', fromPersonId: 1, state: 'DRAFT' }],
    });
    await page.goto('/');
    await expect(page.getByTestId('rollup-apex-nonfinal')).toHaveText('Sol'); // Sol 750 is the highest not FINAL (then Cam 400)
  });
});
