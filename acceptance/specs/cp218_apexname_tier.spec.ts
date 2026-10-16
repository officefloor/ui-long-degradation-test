import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

test.describe('apex by tier', () => {
  test('top name per tier', { tag: '@functionality' }, async ({ page }) => {
    // Hela is on hold: she still shows on the list, but is left out of sheet-wide figures: she is never a top name.
    // SURGE without her: Ada 2000 is highest (Hela's 2400 would win if she counted).
    // Sol is shared from sheet S9: counted here like anyone (momentum 150, STEADY, band C x2 -> 300),
    // so she beats Dot 240 in STEADY.
    await resetAndSeed({
      sheets: [
        { id: 'S9', people: [
          { id: 1, name: 'Sol', alpha: 15, beta: 10, gamma: 15, grade: 'LOW', state: 'DRAFT', active: true },
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
    await expect(page.getByTestId('apexname-tier-SURGE')).toHaveText('Ada');
    await expect(page.getByTestId('apexname-tier-STEADY')).toHaveText('Sol');
    await expect(page.getByTestId('apexname-tier-SINK')).toHaveText('Gwe');
  });

  // Bob and Cat are level at the top value (scaled 2000); all three are SURGE (momentum >= 200), so
  // the SURGE top names both, joined by ", " in alphabetical order.
  // Ace is SURGE too (momentum 300) but lower (scaled 900). Hela (SURGE, scaled 2400) is on hold,
  // so she is never the apex.
  // Sol is shared from sheet S9: counted here like anyone (SURGE, scaled 2000), level with Bob and Cat.
  test('tier top names everyone level at the top', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      sheets: [
        { id: 'S9', people: [
          { id: 1, name: 'Sol', alpha: 10, beta: 50, gamma: 10, grade: 'HIGH', state: 'FINAL', active: true }, // momentum 500 (SURGE) -> band A x4 -> scaled 2000
        ] },
      ],
      shares: [{ personId: 8, fromSheetId: 'S9', fromPersonId: 1 }],
      people: [
        { id: 1, name: 'Ace', alpha: 10, beta: 30, gamma: 10, grade: 'HIGH', state: 'FINAL', active: true }, // momentum 300 (SURGE) -> band B x3 -> scaled 900
        { id: 2, name: 'Cat', alpha: 10, beta: 50, gamma: 10, grade: 'HIGH', state: 'FINAL', active: true }, // momentum 500 (SURGE) -> band A x4 -> scaled 2000
        { id: 3, name: 'Bob', alpha: 10, beta: 50, gamma: 10, grade: 'HIGH', state: 'FINAL', active: true }, // momentum 500 (SURGE) -> band A x4 -> scaled 2000
        { id: 9, name: 'Hela', alpha: 10, beta: 60, gamma: 10, grade: 'HIGH', state: 'FINAL', active: true, hold: true }, // momentum 600 -> band A x4 -> scaled 2400
      ],
    });
    await page.goto('/');
    // SURGE top value 2000: Bob, Cat and Sol (Ace 900 is below)
    await expect(page.getByTestId('apexname-tier-SURGE')).toHaveText('Bob, Cat, Sol');
  });
});
