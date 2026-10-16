import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

test.describe('apex by state', () => {
  test('top name per state', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      people: [
        { id: 1, name: 'Ada', alpha: 10, beta: 50, gamma: 10, grade: 'HIGH', state: 'FINAL', active: true },
        { id: 2, name: 'Ben', alpha: 10, beta: 30, gamma: 10, grade: 'MID', state: 'FINAL', active: true },
        { id: 3, name: 'Cam', alpha: 10, beta: 20, gamma: 10, grade: 'LOW', state: 'REVIEW', active: true },
        { id: 4, name: 'Dot', alpha: 4, beta: 30, gamma: 4, grade: 'HIGH', state: 'DRAFT', active: true },
        { id: 5, name: 'Eli', alpha: 8, beta: 10, gamma: 8, grade: 'MID', state: 'DRAFT', active: true },
        { id: 6, name: 'Fin', alpha: 2, beta: 30, gamma: 2, grade: 'LOW', state: 'REVIEW', active: true },
        { id: 7, name: 'Gwe', alpha: 5, beta: 1, gamma: 0, grade: 'HIGH', state: 'DRAFT', active: true },
        // Hela is on hold (momentum 600, scaled 2400): left out of counts and top names, totals count her at half (with her the FINAL apex would be Hela)
        { id: 9, name: 'Hela', alpha: 10, beta: 60, gamma: 10, grade: 'HIGH', state: 'FINAL', active: true, hold: true },
      ],
      // Sol is shared from sheet S9 as row 8: counted here like anyone (REVIEW here, momentum 250,
      // band B x3 -> 750, above Cam's 400)
      sheets: [
        { id: 'S9', people: [
          { id: 1, name: 'Sol', alpha: 10, beta: 25, gamma: 10, grade: 'LOW', state: 'REVIEW', active: true },
        ] },
      ],
      shares: [{ personId: 8, fromSheetId: 'S9', fromPersonId: 1, state: 'REVIEW' }],
    });
    await page.goto('/');
    await expect(page.getByTestId('apexname-state-FINAL')).toHaveText('Ada');
    await expect(page.getByTestId('apexname-state-REVIEW')).toHaveText('Sol');
    await expect(page.getByTestId('apexname-state-DRAFT')).toHaveText('Dot');
  });

  // Within state FINAL, Bob, Cat and Sol are level at the top value (scaled 2000), so the state's top
  // names all three, joined by ", " in alphabetical order. Ace is FINAL but lower (scaled 900).
  // Sol is shared from sheet S9 as row 8: counted here like anyone (FINAL here).
  test('state top names everyone level at the top', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      people: [
        { id: 1, name: 'Ace', alpha: 10, beta: 30, gamma: 10, grade: 'HIGH', state: 'FINAL', active: true }, // momentum 300 -> band B x3 -> scaled 900
        { id: 2, name: 'Cat', alpha: 10, beta: 50, gamma: 10, grade: 'HIGH', state: 'FINAL', active: true }, // momentum 500 -> band A x4 -> scaled 2000
        { id: 3, name: 'Bob', alpha: 10, beta: 50, gamma: 10, grade: 'HIGH', state: 'FINAL', active: true }, // momentum 500 -> band A x4 -> scaled 2000
        // Hela is on hold: left out of every top name (with her the FINAL apex would be Hela)
        { id: 9, name: 'Hela', alpha: 10, beta: 60, gamma: 10, grade: 'HIGH', state: 'FINAL', active: true, hold: true }, // momentum 600 -> band A x4 -> scaled 2400
      ],
      sheets: [
        { id: 'S9', people: [
          { id: 1, name: 'Sol', alpha: 10, beta: 50, gamma: 10, grade: 'HIGH', state: 'FINAL', active: true }, // momentum 500 -> band A x4 -> scaled 2000
        ] },
      ],
      shares: [{ personId: 8, fromSheetId: 'S9', fromPersonId: 1, state: 'FINAL' }],
    });
    await page.goto('/');
    // FINAL top value 2000: Bob, Cat and Sol (Ace 900 is below)
    await expect(page.getByTestId('apexname-state-FINAL')).toHaveText('Bob, Cat, Sol');
  });
});
