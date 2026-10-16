import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

test.describe('apex by bracket', () => {
  test('top name per quartile', { tag: '@functionality' }, async ({ page }) => {
    // Quartiles by value: Q4 800 or more, Q3 200 or more, Q2 50 or more, Q1 below.
    // The sheet multiplies band B by 2 (not 3): Ben 300 x 2 = 600 drops to Q3, above Cam's 400.
    // Sol is shared from sheet S9 as row 8: counted here like anyone (momentum 90, band D x1 -> 90, Q2,
    // above Eli's 80).
    // A change dated after the anchor does not count yet: Eli's beta 40 from 2026-04-01.
    await resetAndSeed({
      anchor: '2026-03-01',
      settings: { bandMultipliers: { A: 4, B: 2, C: 2, D: 1, E: 0 } },
      people: [
        { id: 1, name: 'Ada', alpha: 10, beta: 50, gamma: 10, grade: 'HIGH', state: 'FINAL', active: true },
        { id: 2, name: 'Ben', alpha: 10, beta: 30, gamma: 10, grade: 'MID', state: 'FINAL', active: true },
        { id: 3, name: 'Cam', alpha: 10, beta: 20, gamma: 10, grade: 'LOW', state: 'REVIEW', active: true },
        { id: 4, name: 'Dot', alpha: 4, beta: 30, gamma: 4, grade: 'HIGH', state: 'DRAFT', active: true },
        { id: 5, name: 'Eli', alpha: 8, beta: 10, gamma: 8, grade: 'MID', state: 'DRAFT', active: true },
        { id: 6, name: 'Fin', alpha: 2, beta: 30, gamma: 2, grade: 'LOW', state: 'REVIEW', active: true },
        { id: 7, name: 'Gwe', alpha: 5, beta: 1, gamma: 0, grade: 'HIGH', state: 'DRAFT', active: true },
        // Hela is on hold (momentum 600, scaled 2400): left out of counts and top names, totals count her at half (with her the Q4 apex would be Hela)
        { id: 9, name: 'Hela', alpha: 10, beta: 60, gamma: 10, grade: 'HIGH', state: 'FINAL', active: true, hold: true },
      ],
      sheets: [
        { id: 'S9', people: [
          { id: 1, name: 'Sol', alpha: 9, beta: 10, gamma: 9, grade: 'LOW', state: 'REVIEW', active: true },
        ] },
      ],
      shares: [{ personId: 8, fromSheetId: 'S9', fromPersonId: 1, state: 'REVIEW' }],
      history: [{ personId: 5, field: 'beta', value: 40, from: '2026-04-01' }],
    });
    await page.goto('/');
    await expect(page.getByTestId('apexname-bracket-Q4')).toHaveText('Ada');   // Ada 2000
    await expect(page.getByTestId('apexname-bracket-Q3')).toHaveText('Ben');   // Ben 600, Cam 400, Dot 240
    await expect(page.getByTestId('apexname-bracket-Q2')).toHaveText('Sol');   // Sol 90, Eli 80, Fin 60
    await expect(page.getByTestId('apexname-bracket-Q1')).toHaveText('Gwe');   // Gwe 0

    // as of 2026-04-15 Eli's beta 40 counts: momentum 8 x 40 = 320, band B x2 -> 640, Q3 above Ben's 600
    await page.getByTestId('sheet-as-of').fill('2026-04-15');
    await page.getByTestId('sheet-as-of-apply').click();
    await expect(page.getByTestId('apexname-bracket-Q3')).toHaveText('Eli');
  });

  // Bob, Cat and Sol are level at the top value (scaled 2000); all sit in Q4 (800 or more), so the
  // Q4 top names all three, joined by ", " in alphabetical order. Ace is Q4 too (scaled 900) but lower.
  // Sol is shared from sheet S9 as row 8: counted here like anyone.
  test('quartile top names everyone level at the top', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      people: [
        { id: 1, name: 'Ace', alpha: 10, beta: 30, gamma: 10, grade: 'HIGH', state: 'FINAL', active: true }, // momentum 300 -> band B x3 -> scaled 900 -> Q4
        { id: 2, name: 'Cat', alpha: 10, beta: 50, gamma: 10, grade: 'HIGH', state: 'FINAL', active: true }, // momentum 500 -> band A x4 -> scaled 2000 -> Q4
        { id: 3, name: 'Bob', alpha: 10, beta: 50, gamma: 10, grade: 'HIGH', state: 'FINAL', active: true }, // momentum 500 -> band A x4 -> scaled 2000 -> Q4
        // Hela is on hold: left out of every top name (with her the Q4 apex would be Hela)
        { id: 9, name: 'Hela', alpha: 10, beta: 60, gamma: 10, grade: 'HIGH', state: 'FINAL', active: true, hold: true }, // momentum 600 -> band A x4 -> scaled 2400 -> Q4
      ],
      sheets: [
        { id: 'S9', people: [
          { id: 1, name: 'Sol', alpha: 10, beta: 50, gamma: 10, grade: 'HIGH', state: 'FINAL', active: true }, // momentum 500 -> band A x4 -> scaled 2000 -> Q4
        ] },
      ],
      shares: [{ personId: 8, fromSheetId: 'S9', fromPersonId: 1, state: 'FINAL' }],
    });
    await page.goto('/');
    // Q4 top value 2000: Bob, Cat and Sol (Ace 900 is below)
    await expect(page.getByTestId('apexname-bracket-Q4')).toHaveText('Bob, Cat, Sol');
  });
});
