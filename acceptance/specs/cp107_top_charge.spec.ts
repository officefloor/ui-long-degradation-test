import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// top charge rollup: name of the highest-charge person (ties by name asc).
// charge = vector + yield; vector = total of the patrons' blend; yield = pivot + lift.
//   Ada: yield 33+48=81, vector Ben -3 + Dot 200 = 197 -> charge 278
//   Ben: yield -4+0=-4, no patrons -> charge -4
//   Dot: yield 400+600=1000, vector Ben -3 -> charge 997
// Sol is shared from sheet S9 as row 8: counted here like anyone. Same numbers as Hela, not on hold:
//   torque 300 + 3*0 = 300, verge C=4 -> pivot 1200; blend 1+300=301 -> L3 -> lift 903;
//   yield 1200+903=2103, no patrons -> charge 2103, beating Dot's 997, so she is the top name.
// Hela is on hold: left out of sheet-wide figures, so she is never the top name even with
// Sol's charge of 2103.

test.describe('top charge', () => {
  test('names the highest-charge person', { tag: '@functionality' }, async ({ page }) => {
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
  regions: [
    { personId: 1, region: 'N1' }, { personId: 2, region: 'S2' }, { personId: 3, region: 'E5' },
    { personId: 9, region: 'E9' },
  ],
  sheets: [{ id: 'S9', people: [
    { id: 1, name: 'Sol', alpha: 1, beta: 1, gamma: 1, delta: 10, epsilon: 30, zeta: 10, kind: 'C', active: true },
  ], regions: [{ personId: 1, region: 'E1' }] }],
  shares: [{ personId: 8, fromSheetId: 'S9', fromPersonId: 1 }],
});
    await page.goto('/');

    await expect(page.getByTestId('rollup-top-charge')).toHaveText('Sol');
  });

  // Tie-break: identical inputs give equal charge, so the alphabetical tie-break decides. Bob is
  // seeded first / lower id to prove it is name order, not seed order.
  //   each: momentum 1, torque 1*1 + 3*0 = 1; verge A=1 -> pivot 1; blend 1+1=2 -> L1 x1 -> lift 2;
  //   yield 1+2=3; no patrons -> vector 0; charge 0+3=3
  // Hela is on hold with a higher charge (torque 2, pivot 2, blend 3 -> lift 3, yield 2+3=5,
  // charge 5), but is left out of the top name.
  // Abe is shared from sheet S9 as row 8: counted here like anyone, ties at 3 and comes first by name.
  test('breaks a charge tie alphabetically', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      people: [
        { id: 1, name: 'Bob', alpha: 1, beta: 1, gamma: 1, delta: 1, epsilon: 1, zeta: 1, kind: 'A', active: true }, // charge 3
        { id: 2, name: 'Ana', alpha: 1, beta: 1, gamma: 1, delta: 1, epsilon: 1, zeta: 1, kind: 'A', active: true }, // charge 3
        { id: 9, name: 'Hela', alpha: 1, beta: 1, gamma: 1, delta: 1, epsilon: 2, zeta: 1, kind: 'A', active: true, hold: true }, // on hold
      ],
      sheets: [{ id: 'S9', people: [
        { id: 1, name: 'Abe', alpha: 1, beta: 1, gamma: 1, delta: 1, epsilon: 1, zeta: 1, kind: 'A', active: true }, // charge 3
      ] }],
      shares: [{ personId: 8, fromSheetId: 'S9', fromPersonId: 1 }],
    });
    await page.goto('/');

    await expect(page.getByTestId('rollup-top-charge')).toHaveText('Abe');
  });
});
