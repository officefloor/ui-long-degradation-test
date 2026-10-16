import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// top brace rollup: name of the highest-brace person.
// Everyone tied at the top is named, by name. Dot 200.
// Hela is on hold: left out of sheet-wide figures, so she is never the top name even with the
// highest brace (influence 1 + force 300).

test.describe('top brace', () => {
  test('names the highest-brace person', { tag: '@functionality' }, async ({ page }) => {
    // Sol is shared from sheet S9: counted here like anyone; his inputs match Dot's, so he ties at brace 200
    await resetAndSeed({
  sheets: [
    { id: 'S9', people: [{ id: 1, name: 'Sol', alpha: 5, beta: 20, gamma: 5, delta: 5, epsilon: 20, zeta: 5, active: true }] },
  ],
  shares: [{ personId: 8, fromSheetId: 'S9', fromPersonId: 1 }],
  people: [
    { id: 1, name: 'Ada', alpha: 2, beta: 3,  gamma: 5, delta: 3, epsilon: 4,  zeta: 10, active: true },
    { id: 2, name: 'Ben', alpha: 4, beta: 2,  gamma: 1, delta: 5, epsilon: 2,  zeta: 1,  active: true },
    { id: 3, name: 'Dot', alpha: 5, beta: 20, gamma: 5, delta: 5, epsilon: 20, zeta: 5,  active: true },
    { id: 9, name: 'Hela', alpha: 1, beta: 1,  gamma: 1, delta: 10, epsilon: 30, zeta: 10, active: true, hold: true },
  ],
});
    await page.goto('/');

    await expect(page.getByTestId('rollup-top-brace')).toHaveText('Dot, Sol');
  });

  // Two people with identical inputs have equal brace, so both are named, joined by ", " in
  // alphabetical order (Bob is seeded first and has the lower id: the order is by name).
  //   each: momentum 1 -> influence 1; force 1; brace 1 + 2*1 = 3
  // Hela is on hold and has a higher brace (force 2), but is left out of the top name.
  test('names everyone tied for the top brace', { tag: '@functionality' }, async ({ page }) => {
    // Sol is shared from sheet S9: counted here like anyone; his identical inputs tie him at brace 3
    await resetAndSeed({
      sheets: [
        { id: 'S9', people: [{ id: 1, name: 'Sol', alpha: 1, beta: 1, gamma: 1, delta: 1, epsilon: 1, zeta: 1, active: true }] },
      ],
      shares: [{ personId: 8, fromSheetId: 'S9', fromPersonId: 1 }],
      people: [
        { id: 1, name: 'Bob', alpha: 1, beta: 1, gamma: 1, delta: 1, epsilon: 1, zeta: 1, active: true }, // brace 3
        { id: 2, name: 'Ana', alpha: 1, beta: 1, gamma: 1, delta: 1, epsilon: 1, zeta: 1, active: true }, // brace 3
        { id: 9, name: 'Hela', alpha: 1, beta: 1, gamma: 1, delta: 1, epsilon: 2, zeta: 1, active: true, hold: true }, // on hold
      ],
    });
    await page.goto('/');

    await expect(page.getByTestId('rollup-top-brace')).toHaveText('Ana, Bob, Sol');
  });
});
