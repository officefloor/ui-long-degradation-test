import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

test.describe('stratum', () => {
  test('top/bottom vs median', { tag: '@functionality' }, async ({ page }) => {
    // Hela is on hold: she still shows on the list, but is left out of sheet-wide figures (counted at half in totals).
    // Sol is shared from sheet S9: counted here like anyone (momentum 3 x 10 = 30, band D -> 30).
    // Values without her: 0, 30, 60, 80, 240, 400, 900, 2000 -> middle (lower of 80 and 240) 80:
    // Ada, Ben, Cam, Dot, Eli are at or above it (TOP); Fin, Sol, Gwe are BOT.
    // Counting her 2400 (middle 240) would make Eli BOT.
    // A change dated after the anchor does not count yet: Fin's beta 50 from 2026-04-01 (momentum 100,
    // band C -> 200) would move the middle value to 200 and make Eli BOT.
    await resetAndSeed({
      anchor: '2026-03-01',
      history: [{ personId: 6, field: 'beta', value: 50, from: '2026-04-01' }],
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
        { id: 9, name: 'Hela', alpha: 10, beta: 60, gamma: 10, grade: 'LOW', state: 'DRAFT', active: true, hold: true }, // momentum 600 -> band A x4 -> scaled 2400
      ],
    });
    await page.goto('/');
    await expect(page.getByTestId('person-row-1').getByTestId('concept-stratum')).toHaveText('TOP');
    await expect(page.getByTestId('person-row-2').getByTestId('concept-stratum')).toHaveText('TOP');
    await expect(page.getByTestId('person-row-3').getByTestId('concept-stratum')).toHaveText('TOP');
    await expect(page.getByTestId('person-row-4').getByTestId('concept-stratum')).toHaveText('TOP');
    await expect(page.getByTestId('person-row-5').getByTestId('concept-stratum')).toHaveText('TOP');
    await expect(page.getByTestId('person-row-6').getByTestId('concept-stratum')).toHaveText('BOT');
    await expect(page.getByTestId('person-row-7').getByTestId('concept-stratum')).toHaveText('BOT');
    await expect(page.getByTestId('person-row-8').getByTestId('concept-stratum')).toHaveText('BOT');
  });
});
