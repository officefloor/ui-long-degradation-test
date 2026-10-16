import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

test.describe('apex by grade', () => {
  test('top name per grade', { tag: '@functionality' }, async ({ page }) => {
    // Hela is on hold: she still shows on the list, but is left out of sheet-wide figures: she is never a top name.
    // Sol is shared from sheet S9 as row 8: counted here like anyone (LOW, momentum 250, band B x3 -> 750).
    // LOW without her: Sol 750 beats Cam 400 and Fin 60 -> Sol (Hela's 753 would win if she counted).
    await resetAndSeed({
      people: [
        { id: 1, name: 'Ada', alpha: 10, beta: 50, gamma: 10, grade: 'HIGH', state: 'FINAL', active: true },
        { id: 2, name: 'Ben', alpha: 10, beta: 30, gamma: 10, grade: 'MID', state: 'FINAL', active: true },
        { id: 3, name: 'Cam', alpha: 10, beta: 20, gamma: 10, grade: 'LOW', state: 'REVIEW', active: true },
        { id: 4, name: 'Dot', alpha: 4, beta: 30, gamma: 4, grade: 'HIGH', state: 'DRAFT', active: true },
        { id: 5, name: 'Eli', alpha: 8, beta: 10, gamma: 8, grade: 'MID', state: 'DRAFT', active: true },
        { id: 6, name: 'Fin', alpha: 2, beta: 30, gamma: 2, grade: 'LOW', state: 'REVIEW', active: true },
        { id: 7, name: 'Gwe', alpha: 5, beta: 1, gamma: 0, grade: 'HIGH', state: 'DRAFT', active: true },
        { id: 9, name: 'Hela', alpha: 1, beta: 251, gamma: 1, grade: 'LOW', state: 'DRAFT', active: true, hold: true }, // momentum 251 -> band B x3 -> scaled 753, half 376.5 -> 377 (to the nearest)
      ],
      sheets: [
        { id: 'S9', people: [
          { id: 1, name: 'Sol', alpha: 10, beta: 25, gamma: 10, grade: 'LOW', state: 'REVIEW', active: true },
        ] },
      ],
      shares: [{ personId: 8, fromSheetId: 'S9', fromPersonId: 1, state: 'REVIEW' }],
    });
    await page.goto('/');
    await expect(page.getByTestId('apexname-grade-HIGH')).toHaveText('Ada');
    await expect(page.getByTestId('apexname-grade-MID')).toHaveText('Ben');
    await expect(page.getByTestId('apexname-grade-LOW')).toHaveText('Sol');
  });

  // Within grade HIGH, Bob, Cat and Sol are level at the top value (scaled 2000), so the grade's top
  // names all three, joined by ", " in alphabetical order. Ace is HIGH too but lower (scaled 900).
  // Sol is shared from sheet S9 as row 8: counted here like anyone.
  test('grade top names everyone level at the top', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      people: [
        { id: 1, name: 'Ace', alpha: 10, beta: 30, gamma: 10, grade: 'HIGH', state: 'FINAL', active: true }, // momentum 300 -> band B x3 -> scaled 900
        { id: 2, name: 'Cat', alpha: 10, beta: 50, gamma: 10, grade: 'HIGH', state: 'FINAL', active: true }, // momentum 500 -> band A x4 -> scaled 2000
        { id: 3, name: 'Bob', alpha: 10, beta: 50, gamma: 10, grade: 'HIGH', state: 'FINAL', active: true }, // momentum 500 -> band A x4 -> scaled 2000
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
    // HIGH top value 2000: Bob, Cat and Sol (Ace 900 is below)
    await expect(page.getByTestId('apexname-grade-HIGH')).toHaveText('Bob, Cat, Sol');
  });
});
