import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

//   tide counts the positive brace of the people a person follows and of those who follow them:
//     brace Ada 39, Ben 19, Dot 300, Gus -59, Sol 30
//     Ada 19+300+30 = 349 (Gus dropped), Ben (Ada, Dot) 39+300 = 339, Dot (Ben, Ada) 19+39 = 58,
//     Gus (Ada) 39, Sol (Ada) 39
// Hela is on hold, so she does not count towards anyone else's figures: Dot follows her and she
// follows Ben, but her brace (1 + 2*5 = 11) is left out of their tide. Her own tide counts Ben and
// Dot: 19+300 = 319, and the total counts it at half: floor(319/2) = 159.
//   total 349 + 339 + 58 + 39 + 39 + 159 = 983

test.describe('total tide', () => {
  test('total tide sums the tides', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
  people: [
    { id: 1, name: 'Ada', alpha: 2, beta: 3,  gamma: 5, delta: 3,  epsilon: 4,   zeta: 10, active: true },
    { id: 2, name: 'Ben', alpha: 4, beta: 2,  gamma: 1, delta: 5,  epsilon: 2,   zeta: 1,  active: true },
    { id: 3, name: 'Dot', alpha: 5, beta: 20, gamma: 5, delta: 5,  epsilon: 20,  zeta: 5,  active: true },
    { id: 4, name: 'Gus', alpha: 1, beta: 1,  gamma: 1, delta: 1,  epsilon: -30, zeta: 1,  active: true },
    { id: 9, name: 'Hela', alpha: 1, beta: 1,  gamma: 1, delta: 1,  epsilon: 5,   zeta: 1,  active: true, hold: true },
  ],
  follows: [
    { from: 1, to: 2 }, { from: 1, to: 3 }, { from: 1, to: 4 }, { from: 1, to: 8 },
    { from: 3, to: 2 }, { from: 3, to: 9 },
    { from: 9, to: 2 },
  ],
  // Sol is shared from sheet S9 as row 8: counted here like anyone (brace 10 + 2*10 = 30), and Ada follows her
  sheets: [{ id: 'S9', people: [
    { id: 1, name: 'Sol', alpha: 2, beta: 5, gamma: 2, delta: 2, epsilon: 5, zeta: 2, active: true },
  ] }],
  shares: [{ personId: 8, fromSheetId: 'S9', fromPersonId: 1 }],
});
    await page.goto('/');

    await expect(page.getByTestId('rollup-total-tide')).toHaveText('983');
  });
});
