import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// top charge rollup: name of the highest-charge person (ties by name asc).
// Sol is shared from sheet S9 as row 8: counted here like anyone, and her charge 3306 (same numbers
// as Hela, not on hold) beats Dot's 1697, so she is the top name.
// Hela is on hold: left out of sheet-wide figures, so she is never the top name even with the
// highest charge (torque 300, pivot 1500, blend 301 -> lift 903, yield 1500+2*903=3306).

test.describe('top charge', () => {
  test('names the highest-charge person', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
  people: [
    { id: 1, name: 'Ada', alpha: 2, beta: 3,  gamma: 5, delta: 3, epsilon: 4,  zeta: 10, kind: 'A', region: 'N1', active: true },
    { id: 2, name: 'Ben', alpha: 4, beta: 2,  gamma: 1, delta: 5, epsilon: 2,  zeta: 1,  kind: 'B', region: 'S2', active: true },
    { id: 3, name: 'Dot', alpha: 5, beta: 20, gamma: 5, delta: 5, epsilon: 20, zeta: 5,  kind: 'C', region: 'E5', active: true },
    { id: 9, name: 'Hela', alpha: 1, beta: 1,  gamma: 1, delta: 10, epsilon: 30, zeta: 10, kind: 'C', region: 'E9', active: true, hold: true },
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
    { id: 1, name: 'Sol', alpha: 1, beta: 1, gamma: 1, delta: 10, epsilon: 30, zeta: 10, kind: 'C', region: 'E1', active: true },
  ] }],
  shares: [{ personId: 8, fromSheetId: 'S9', fromPersonId: 1 }],
});
    await page.goto('/');

    await expect(page.getByTestId('rollup-top-charge')).toHaveText('Sol');
  });

  // Tie-break: identical inputs give equal charge, so the alphabetical tie-break decides. Bob is
  // seeded first / lower id to prove it is name order, not seed order.
  //   each: torque 1; verge A=2 -> pivot 2; blend 2 -> drag L1 x1 -> lift 2; yield 2 + 2*2 = 6
  //   no patrons -> vector 0; charge 0 + 6 = 6
  // Hela is on hold with a higher charge (pivot 4 + 2*lift 3 = 10), but is left out of the top name.
  // Abe is shared from sheet S9 as row 8: counted here like anyone, ties at 6 and comes first by name.
  test('breaks a charge tie alphabetically', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      people: [
        { id: 1, name: 'Bob', alpha: 1, beta: 1, gamma: 1, delta: 1, epsilon: 1, zeta: 1, kind: 'A', active: true }, // charge 6
        { id: 2, name: 'Ana', alpha: 1, beta: 1, gamma: 1, delta: 1, epsilon: 1, zeta: 1, kind: 'A', active: true }, // charge 6
        { id: 9, name: 'Hela', alpha: 1, beta: 1, gamma: 1, delta: 1, epsilon: 2, zeta: 1, kind: 'A', active: true, hold: true }, // on hold
      ],
      sheets: [{ id: 'S9', people: [
        { id: 1, name: 'Abe', alpha: 1, beta: 1, gamma: 1, delta: 1, epsilon: 1, zeta: 1, kind: 'A', active: true }, // charge 6
      ] }],
      shares: [{ personId: 8, fromSheetId: 'S9', fromPersonId: 1 }],
    });
    await page.goto('/');

    await expect(page.getByTestId('rollup-top-charge')).toHaveText('Abe');
  });
});
