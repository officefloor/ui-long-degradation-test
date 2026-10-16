import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// top crest rollup: name of the person with the highest crest.
// Everyone tied at the top is named, by name. Dot 210.
// Hela is on hold: left out of the top name (momentum 300 + torque 1 = blend 301, no patrons -> crest
// 301, level with the highest).

test.describe('top crest', () => {
  test('names the highest-crest person', { tag: '@functionality' }, async ({ page }) => {
    // Sol is shared from sheet S9: counted here like anyone; his crest 301 (Hela's inputs) is the highest
    await resetAndSeed({
  sheets: [
    { id: 'S9', people: [{ id: 1, name: 'Sol', alpha: 10, beta: 30, gamma: 10, delta: 1, epsilon: 1, zeta: 1 }] },
  ],
  shares: [{ personId: 8, fromSheetId: 'S9', fromPersonId: 1 }],
  people: [
    { id: 1, name: 'Ada', alpha: 2, beta: 3,  gamma: 5, delta: 3, epsilon: 4,  zeta: 10 },
    { id: 2, name: 'Ben', alpha: 4, beta: 2,  gamma: 1, delta: 5, epsilon: 2,  zeta: 1 },
    { id: 3, name: 'Dot', alpha: 5, beta: 20, gamma: 5, delta: 5, epsilon: 20, zeta: 5 },
    { id: 9, name: 'Hela', alpha: 10, beta: 30, gamma: 10, delta: 1, epsilon: 1, zeta: 1, hold: true },
  ],
  patrons: [
    { personId: 1, patronId: 2 }, { personId: 1, patronId: 3 },
    { personId: 3, patronId: 2 },
  ],
});
    await page.goto('/');

    await expect(page.getByTestId('rollup-top-crest')).toHaveText('Sol');
  });

  // Two people with identical inputs have equal crest, so both are named, joined by ", " in
  // alphabetical order (Bob is seeded first and has the lower id: the order is by name).
  //   each: thrust 1, drift 0, momentum 1; force 1, sway 0, torque 1; blend 2; no patrons -> flux 0; crest 2
  test('names everyone tied for the top crest', { tag: '@functionality' }, async ({ page }) => {
    // Sol is shared from sheet S9: counted here like anyone; his identical inputs tie him at crest 2
    await resetAndSeed({
      sheets: [
        { id: 'S9', people: [{ id: 1, name: 'Sol', alpha: 1, beta: 1, gamma: 1, delta: 1, epsilon: 1, zeta: 1, active: true }] },
      ],
      shares: [{ personId: 8, fromSheetId: 'S9', fromPersonId: 1 }],
      people: [
        { id: 1, name: 'Bob', alpha: 1, beta: 1, gamma: 1, delta: 1, epsilon: 1, zeta: 1, active: true }, // crest 2
        { id: 2, name: 'Ana', alpha: 1, beta: 1, gamma: 1, delta: 1, epsilon: 1, zeta: 1, active: true }, // crest 2
        { id: 9, name: 'Hela', alpha: 1, beta: 1, gamma: 1, delta: 1, epsilon: 1, zeta: 1, active: true, hold: true }, // crest 2, on hold: not named
      ],
    });
    await page.goto('/');

    await expect(page.getByTestId('rollup-top-crest')).toHaveText('Ana, Bob, Sol');
  });
});
