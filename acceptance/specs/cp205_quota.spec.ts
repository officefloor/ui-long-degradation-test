import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

test.describe('quota top half', () => {
  test('top half by rank', { tag: '@functionality' }, async ({ page }) => {
    // Hela is on hold: she still shows on the list, but is left out of sheet-wide figures and has no rank.
    // Sol is shared from sheet S9: ranked here like anyone (momentum 400, band B -> 1200).
    // Ranked without her: Ada 2000, Sol 1200, Ben 900, Cam 400, Dot 240, Eli 80, Fin 60, Gwe 0; 8 people,
    // half = 4 -> Ada, Sol, Ben, Cam are yes, Dot is no.
    // Ranking her too (9 people, half rounded up = 5) would take Dot as well.
    await resetAndSeed({
      sheets: [
        { id: 'S9', people: [
          { id: 1, name: 'Sol', alpha: 10, beta: 40, gamma: 10, grade: 'MID', state: 'DRAFT', active: true },
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
    await expect(page.getByTestId('person-row-1').getByTestId('concept-quota')).toHaveText('yes');
    await expect(page.getByTestId('person-row-2').getByTestId('concept-quota')).toHaveText('yes');
    await expect(page.getByTestId('person-row-3').getByTestId('concept-quota')).toHaveText('yes');
    await expect(page.getByTestId('person-row-8').getByTestId('concept-quota')).toHaveText('yes');
    await expect(page.getByTestId('person-row-4').getByTestId('concept-quota')).toHaveText('no');
    await expect(page.getByTestId('person-row-5').getByTestId('concept-quota')).toHaveText('no');
    await expect(page.getByTestId('person-row-6').getByTestId('concept-quota')).toHaveText('no');
    await expect(page.getByTestId('person-row-7').getByTestId('concept-quota')).toHaveText('no');
  });
});
