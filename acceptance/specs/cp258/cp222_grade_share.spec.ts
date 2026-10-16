import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

test.describe('grade share', () => {
  test('grade counts as percent', { tag: '@functionality' }, async ({ page }) => {
    // Hela is on hold: she still shows on the list, but is left out of sheet-wide figures and is not counted.
    // Sol is shared from sheet S9 as row 8: counted here like anyone (HIGH).
    // Without Hela, 8 people: HIGH 4 x 100 / 8 = 50, MID 2 x 100 / 8 = 25, LOW 2 x 100 / 8 = 25 (rounded down).
    // Counting her (LOW, 9 people) would give 44, 22, 33; without Sol it would be 42, 28, 28.
    await resetAndSeed({
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
      sheets: [
        { id: 'S9', people: [
          { id: 1, name: 'Sol', alpha: 5, beta: 20, gamma: 5, grade: 'HIGH', state: 'REVIEW', active: true },
        ] },
      ],
      shares: [{ personId: 8, fromSheetId: 'S9', fromPersonId: 1, state: 'REVIEW' }],
    });
    await page.goto('/');
    await expect(page.getByTestId('grade-share-HIGH')).toHaveText('42');
    await expect(page.getByTestId('grade-share-MID')).toHaveText('28');
    await expect(page.getByTestId('grade-share-LOW')).toHaveText('28');
  });
});
