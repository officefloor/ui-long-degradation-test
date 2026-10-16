import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

test.describe('state share', () => {
  test('state counts as percent', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      people: [
        { id: 1, name: 'Ada', alpha: 10, beta: 50, gamma: 10, grade: 'HIGH', state: 'FINAL', active: true },
        { id: 2, name: 'Ben', alpha: 10, beta: 30, gamma: 10, grade: 'MID', state: 'FINAL', active: true },
        { id: 3, name: 'Cam', alpha: 10, beta: 20, gamma: 10, grade: 'LOW', state: 'REVIEW', active: true },
        { id: 4, name: 'Dot', alpha: 4, beta: 30, gamma: 4, grade: 'HIGH', state: 'DRAFT', active: true },
        { id: 5, name: 'Eli', alpha: 8, beta: 10, gamma: 8, grade: 'MID', state: 'DRAFT', active: true },
        { id: 6, name: 'Fin', alpha: 2, beta: 30, gamma: 2, grade: 'LOW', state: 'REVIEW', active: true },
        { id: 7, name: 'Gwe', alpha: 5, beta: 1, gamma: 0, grade: 'HIGH', state: 'DRAFT', active: true },
        // Hela is on hold: left out of every count, so the shares are of the eight others (with her, FINAL 3/9 = 33)
        { id: 9, name: 'Hela', alpha: 10, beta: 60, gamma: 10, grade: 'HIGH', state: 'FINAL', active: true, hold: true },
      ],
      // Sol is shared from sheet S9 as row 8: counted here like anyone (REVIEW here)
      sheets: [
        { id: 'S9', people: [
          { id: 1, name: 'Sol', alpha: 5, beta: 20, gamma: 5, grade: 'LOW', state: 'REVIEW', active: true },
        ] },
      ],
      shares: [{ personId: 8, fromSheetId: 'S9', fromPersonId: 1, state: 'REVIEW' }],
    });
    await page.goto('/');
    // 8 counted: FINAL Ada, Ben 2 x 100 / 8 = 25; REVIEW Cam, Fin, Sol 3 x 100 / 8 = 37; DRAFT Dot, Eli, Gwe 3 x 100 / 8 = 37
    // (without Sol, 7 counted: 28, 28, 42)
    await expect(page.getByTestId('state-share-FINAL')).toHaveText('28');
    await expect(page.getByTestId('state-share-REVIEW')).toHaveText('42');
    await expect(page.getByTestId('state-share-DRAFT')).toHaveText('28');
  });
});
