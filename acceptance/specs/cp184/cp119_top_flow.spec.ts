import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// top flow rollup: name of the highest-flow person.
// Everyone tied at the top is named, by name. Dot 1997 (yield 1000 + charge 997).
// Sol is shared from sheet S9 as row 8: counted here like anyone, and her flow 4206 (same numbers as
// Hela, not on hold) beats Dot's, so she is the top name.
// Hela is on hold: left out of sheet-wide figures, so she is never the top name even with a flow
// level with the highest (yield 2103, no patrons or follows -> charge 2103, flow 4206).

test.describe('top flow', () => {
  test('names the highest-flow person', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
  people: [
    { id: 1, name: 'Ada', alpha: 2, beta: 3,  gamma: 5, delta: 3, epsilon: 4,  zeta: 10, kind: 'A', active: true },
    { id: 2, name: 'Ben', alpha: 4, beta: 2,  gamma: 1, delta: 5, epsilon: 2,  zeta: 1,  kind: 'B', active: true },
    { id: 3, name: 'Dot', alpha: 5, beta: 20, gamma: 5, delta: 5, epsilon: 20, zeta: 5,  kind: 'C', active: true },
    { id: 9, name: 'Hela', alpha: 1, beta: 1,  gamma: 1, delta: 10, epsilon: 30, zeta: 10, kind: 'C', active: true, hold: true },
  ],
  patrons: [
    { personId: 1, patronId: 2 }, { personId: 1, patronId: 3 },
    { personId: 3, patronId: 2 },
  ],
  follows: [
    { from: 1, to: 2 }, { from: 1, to: 3 },
    { from: 3, to: 2 },
  ],
  sheets: [{ id: 'S9', people: [
    { id: 1, name: 'Sol', alpha: 1, beta: 1, gamma: 1, delta: 10, epsilon: 30, zeta: 10, kind: 'C', active: true },
  ] }],
  shares: [{ personId: 8, fromSheetId: 'S9', fromPersonId: 1 }],
});
    await page.goto('/');

    await expect(page.getByTestId('rollup-top-flow')).toHaveText('Sol');
  });

  // Identical inputs give equal flow, so both are named, joined by ", " in alphabetical
  // order (Bob is seeded first and has the lower id: the order is by name).
  //   each: torque 1; verge 1 -> pivot 1; blend 2 -> drag L1 x1 -> lift 2; yield 1 + 2 = 3
  //   no patrons -> vector 0 -> charge 3; flow = yield + charge = 3 + 3 = 6
  // Hela is on hold with a higher flow (yield 5, flow 10), but is left out of the top name.
  test('names everyone tied for the top flow', { tag: '@functionality' }, async ({ page }) => {
    // Sol is shared from sheet S9: counted here like anyone; his identical inputs tie him at flow 6
    await resetAndSeed({
      sheets: [
        { id: 'S9', people: [{ id: 1, name: 'Sol', alpha: 1, beta: 1, gamma: 1, delta: 1, epsilon: 1, zeta: 1, kind: 'A', active: true }] },
      ],
      shares: [{ personId: 8, fromSheetId: 'S9', fromPersonId: 1 }],
      people: [
        { id: 1, name: 'Bob', alpha: 1, beta: 1, gamma: 1, delta: 1, epsilon: 1, zeta: 1, kind: 'A', active: true }, // flow 6
        { id: 2, name: 'Ana', alpha: 1, beta: 1, gamma: 1, delta: 1, epsilon: 1, zeta: 1, kind: 'A', active: true }, // flow 6
        { id: 9, name: 'Hela', alpha: 1, beta: 1, gamma: 1, delta: 1, epsilon: 2, zeta: 1, kind: 'A', active: true, hold: true }, // on hold
      ],
    });
    await page.goto('/');

    await expect(page.getByTestId('rollup-top-flow')).toHaveText('Ana, Bob, Sol');
  });
});
