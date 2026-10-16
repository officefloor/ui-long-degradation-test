import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// Hela is on hold: left out of sheet-wide figures, counted at half in totals.
//   Hela momentum 1, torque 7, blend 8 (L1, lift 8), pivot 7*2 = 14 -> yield 22 ; no patrons or
//   follows, so charge 22 and flow 22 + 22 = 44, counted at 44/2 = 22
//   flow (yield + charge): Ada 81+179 = 260, Ben -4-4 = -8, Dot 1000+997 = 1997
// Sol is shared from sheet S9 as row 8: counted here like anyone.
//   Sol momentum 10, torque 10, pivot 10, blend 20 (L1, lift 20) -> yield 30 ; no patrons ->
//   charge 30, flow 60
//   grand 260 + 0 (Ben's -8 counts as zero) + 1997 + 22 + 60 = 2339
// Figures are as of the anchor (2026-03-01): Ada's beta change dated 2026-04-01 does not count yet.

test.describe('grand flow', () => {
  test('grand flow sums the flows', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
  anchor: '2026-03-01',
  people: [
    { id: 1, name: 'Ada', alpha: 2, beta: 3,  gamma: 5, delta: 3, epsilon: 4,  zeta: 10, kind: 'A', active: true },
    { id: 2, name: 'Ben', alpha: 4, beta: 2,  gamma: 1, delta: 5, epsilon: 2,  zeta: 1,  kind: 'B', active: true },
    { id: 3, name: 'Dot', alpha: 5, beta: 20, gamma: 5, delta: 5, epsilon: 20, zeta: 5,  kind: 'C', active: true },
    // Nil's delta is missing -> torque n/a -> yield n/a -> flow n/a, so Nil is skipped (adds nothing).
    { id: 4, name: 'Nil', alpha: 1, beta: 1, gamma: 1, delta: null, epsilon: 1, zeta: 1, kind: 'A', active: true },
    { id: 9, name: 'Hela', alpha: 1, beta: 1, gamma: 1, delta: 1, epsilon: 7, zeta: 1, kind: 'B', active: true, hold: true },
  ],
  patrons: [
    { personId: 1, patronId: 2 }, { personId: 1, patronId: 3 },
    { personId: 3, patronId: 2 },
  ],
  follows: [
    { from: 1, to: 2 }, { from: 1, to: 3 },
    { from: 3, to: 2 },
  ],
  // a change dated after the anchor does not count yet
  history: [
    { personId: 1, field: 'beta', value: 9, from: '2026-04-01' },
  ],
  // Sol is shared from sheet S9 as row 8: counted here like anyone
  sheets: [{ id: 'S9', people: [
    { id: 1, name: 'Sol', alpha: 2, beta: 5, gamma: 2, delta: 2, epsilon: 5, zeta: 2, kind: 'A', active: true },
  ] }],
  shares: [{ personId: 8, fromSheetId: 'S9', fromPersonId: 1 }],
});
    await page.goto('/');

    await expect(page.getByTestId('person-row-4').getByTestId('concept-flow')).toHaveText('n/a');
    await expect(page.getByTestId('rollup-grand-flow')).toHaveText('2339');
  });
});
