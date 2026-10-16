import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

//   brace: Ben 19, Dot 300 (no patrons), Gus -59 (dropped)
//   tide counts the positive brace of the people a person follows and of those who follow them:
//     Ada follows Ben, Dot, Gus, Sol -> 19+300+30 = 349 (Ada's own brace is 39)
//     Ben followed by Ada, Dot -> 39+300 = 339 ; Dot follows Ben, followed by Ada -> 19+39 = 58
//     Gus followed by Ada -> 39
// Hela is on hold, so she does not count towards anyone else's figures: Dot follows her and she
// follows Ben, but her brace (1 + 2*5 = 11) is left out of their tide.

test.describe('tide', () => {
  test('tide sums only positive followed brace', { tag: '@functionality' }, async ({ page }) => {
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

    await expect(page.getByTestId('person-row-1').getByTestId('concept-tide')).toHaveText('349');
    await expect(page.getByTestId('person-row-2').getByTestId('concept-tide')).toHaveText('339');
    await expect(page.getByTestId('person-row-3').getByTestId('concept-tide')).toHaveText('58');
    await expect(page.getByTestId('person-row-4').getByTestId('concept-tide')).toHaveText('39');
  });
});
