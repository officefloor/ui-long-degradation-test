import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

test.describe('state tally', () => {
  test('counts per state', { tag: '@functionality' }, async ({ page }) => {
    // Hela is on hold: left out of sheet-wide figures, counted at half in totals. She is FINAL;
    // counted, FINAL would be 3.
    // Sol is shared from sheet S9: counted here like anyone; put onto this sheet, he starts at DRAFT here
    await resetAndSeed({
      sheets: [
        { id: 'S9', people: [{ id: 1, name: 'Sol', alpha: 5, beta: 20, gamma: 5, grade: 'LOW', state: 'REVIEW', active: true }] },
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
    await expect(page.getByTestId('state-tally-FINAL')).toHaveText('2');
    await expect(page.getByTestId('state-tally-REVIEW')).toHaveText('2');
    await expect(page.getByTestId('state-tally-DRAFT')).toHaveText('4');
  });
});
