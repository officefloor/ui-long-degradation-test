import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// total tide rollup: sum of tides (skip n/a). tide counts the brace of the people a person follows
// and of the people who follow them, each once. brace: Ada 39, Ben 19, Dot 300, Gus -59, Xan 3,
// Sol 30.
//   Ada follows Ben, Dot, Gus, Sol -> 19+300-59+30 = 290 ; Ben followed by Ada, Dot -> 39+300 = 339
//   Dot follows Ben, followed by Ada -> 19+39 = 58 ; Gus followed by Ada -> 39 ; Sol followed by Ada -> 39
// Nil's delta is missing -> force n/a -> brace n/a; Nil follows nobody, but Xan follows Nil, so
// Nil's tide is Xan's brace 3. Xan follows Nil, so Xan's tide is n/a and Xan is skipped.
// Hela is on hold, so she does not count towards anyone else's figures: Dot follows her and she
// follows Ben, but her brace (1 + 2*5 = 11) is left out of their tide. Her own tide counts Ben and
// Dot: 19+300 = 319, and the total counts it at half: floor(319/2) = 159.
//   total 290 + 339 + 58 + 39 + 39 + 3 + 159 = 927

test.describe('total tide', () => {
  test('total tide sums the tides', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
  people: [
    { id: 1, name: 'Ada', alpha: 2, beta: 3,  gamma: 5, delta: 3,    epsilon: 4,   zeta: 10, active: true },
    { id: 2, name: 'Ben', alpha: 4, beta: 2,  gamma: 1, delta: 5,    epsilon: 2,   zeta: 1,  active: true },
    { id: 3, name: 'Dot', alpha: 5, beta: 20, gamma: 5, delta: 5,    epsilon: 20,  zeta: 5,  active: true },
    { id: 4, name: 'Gus', alpha: 1, beta: 1,  gamma: 1, delta: 1,    epsilon: -30, zeta: 1,  active: true },
    { id: 9, name: 'Hela', alpha: 1, beta: 1,  gamma: 1, delta: 1,    epsilon: 5,   zeta: 1,  active: true, hold: true },
    { id: 5, name: 'Nil', alpha: 1, beta: 1,  gamma: 1, delta: null, epsilon: 1,   zeta: 1,  active: true }, // brace n/a; follows nobody -> tide 0
    { id: 6, name: 'Xan', alpha: 1, beta: 1,  gamma: 1, delta: 1,    epsilon: 1,   zeta: 1,  active: true }, // follows Nil -> tide n/a -> skipped
  ],
  follows: [
    { from: 1, to: 2 }, { from: 1, to: 3 }, { from: 1, to: 4 }, { from: 1, to: 8 },
    { from: 3, to: 2 },
    { from: 6, to: 5 },
    { from: 3, to: 9 }, { from: 9, to: 2 },
  ],
  // Sol is shared from sheet S9 as row 8: counted here like anyone (brace 10 + 2*10 = 30), and Ada follows her
  sheets: [{ id: 'S9', people: [
    { id: 1, name: 'Sol', alpha: 2, beta: 5, gamma: 2, delta: 2, epsilon: 5, zeta: 2, active: true },
  ] }],
  shares: [{ personId: 8, fromSheetId: 'S9', fromPersonId: 1 }],
});
    await page.goto('/');

    await expect(page.getByTestId('person-row-6').getByTestId('concept-tide')).toHaveText('n/a');
    await expect(page.getByTestId('rollup-total-tide')).toHaveText('927');
  });
});
