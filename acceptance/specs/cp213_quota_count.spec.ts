import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

test.describe('quota count', () => {
  test('counts people meeting quota', { tag: '@functionality' }, async ({ page }) => {
    // The quota is the top half by value (an odd count rounded up).
    // Sol is shared from sheet S9 as row 10: counted here like anyone (momentum 400, band B -> 1200).
    // Values: Ada 2000, Sol 1200, Ben 900, Cam 400, Dot 240, Eli 80, Fin 60, Ivy 30, Gwe 0. Nine people:
    // half rounded up is 5, so Ada, Sol, Ben, Cam and Dot meet it.
    // Hela is on hold: she still shows on the list, but is not ranked or counted. Counted, ten people
    // would give a quota of 5, and her 240 is level with Dot at the cut-off: 6 meeting it.
    await resetAndSeed({
      sheets: [
        { id: 'S9', people: [
          { id: 1, name: 'Sol', alpha: 10, beta: 40, gamma: 10, grade: 'MID', state: 'DRAFT', active: true },
        ] },
      ],
      shares: [{ personId: 10, fromSheetId: 'S9', fromPersonId: 1 }],
      people: [
        { id: 1, name: 'Ada', alpha: 10, beta: 50, gamma: 10, grade: 'HIGH', state: 'FINAL', active: true },
        { id: 2, name: 'Ben', alpha: 10, beta: 30, gamma: 10, grade: 'MID', state: 'FINAL', active: true },
        { id: 3, name: 'Cam', alpha: 10, beta: 20, gamma: 10, grade: 'LOW', state: 'REVIEW', active: true },
        { id: 4, name: 'Dot', alpha: 4, beta: 30, gamma: 4, grade: 'HIGH', state: 'DRAFT', active: true },
        { id: 5, name: 'Eli', alpha: 8, beta: 10, gamma: 8, grade: 'MID', state: 'DRAFT', active: true },
        { id: 6, name: 'Fin', alpha: 2, beta: 30, gamma: 2, grade: 'LOW', state: 'REVIEW', active: true },
        { id: 7, name: 'Gwe', alpha: 5, beta: 1, gamma: 0, grade: 'HIGH', state: 'DRAFT', active: true },
        { id: 8, name: 'Ivy', alpha: 3, beta: 10, gamma: 3, grade: 'LOW', state: 'REVIEW', active: true }, // momentum 30 -> band D x1 -> scaled 30
        { id: 9, name: 'Hela', alpha: 4, beta: 30, gamma: 4, grade: 'LOW', state: 'DRAFT', active: true, hold: true }, // momentum 120 -> band C x2 -> scaled 240
      ],
    });
    await page.goto('/');
    await expect(page.getByTestId('rollup-quota-count')).toHaveText('5');
  });
});
