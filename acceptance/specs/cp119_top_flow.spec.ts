import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// top flow rollup: name of the highest-flow person (ties by name asc).
// flow = yield + charge + tide; charge = vector + yield; vector = average of the patrons' blend,
// rounded down; tide = total brace of the people a person follows and who follow them, counting
// only positive brace.
//   Dot: yield 400+600=1000; vector Ben -3 -> charge -3+1000=997;
//        tide: follows Ben (brace 19), followed by Ada (brace 200) -> 219; flow 1000+997+219=2216
// Sol is shared from sheet S9 as row 8: counted here like anyone. Same numbers as Hela, not on hold:
//   torque 300, verge C=4 -> pivot 1200; blend 301 -> L3 -> lift 903; yield 2103;
//   no patrons or follows -> charge 2103, tide 0; flow 2103+2103+0=4206, beating Dot's 2216.
// Hela is on hold: left out of sheet-wide figures, so she is never the top name even with
// Sol's flow of 4206.

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

  // Tie-break: identical inputs give equal flow, so the alphabetical tie-break decides. Bob is
  // seeded first / lower id to prove it is name order, not seed order.
  //   each: torque 1; verge A=1 -> pivot 1; blend 2 -> drag L1 x1 -> lift 2; yield 1+2=3
  //   no patrons -> vector 0 -> charge 3; no follows -> tide 0; flow = 3+3+0 = 6
  // Hela is on hold with a higher flow (pivot 2 + lift 3 = yield 5, charge 5, flow 10), but is
  // left out of the top name.
  // Abe is shared from sheet S9 as row 8: counted here like anyone, ties at 6 and comes first by name.
  test('breaks a flow tie alphabetically', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      people: [
        { id: 1, name: 'Bob', alpha: 1, beta: 1, gamma: 1, delta: 1, epsilon: 1, zeta: 1, kind: 'A', active: true }, // flow 6
        { id: 2, name: 'Ana', alpha: 1, beta: 1, gamma: 1, delta: 1, epsilon: 1, zeta: 1, kind: 'A', active: true }, // flow 6
        { id: 9, name: 'Hela', alpha: 1, beta: 1, gamma: 1, delta: 1, epsilon: 2, zeta: 1, kind: 'A', active: true, hold: true }, // on hold
      ],
      sheets: [{ id: 'S9', people: [
        { id: 1, name: 'Abe', alpha: 1, beta: 1, gamma: 1, delta: 1, epsilon: 1, zeta: 1, kind: 'A', active: true }, // flow 6
      ] }],
      shares: [{ personId: 8, fromSheetId: 'S9', fromPersonId: 1 }],
    });
    await page.goto('/');

    await expect(page.getByTestId('rollup-top-flow')).toHaveText('Abe');
  });
});
