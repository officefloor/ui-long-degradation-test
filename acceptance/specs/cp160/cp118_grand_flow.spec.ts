import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// Hela is on hold: left out of sheet-wide figures, counted at half in totals.
//   Hela momentum 1, torque 7, blend 8 (L1, lift 8), pivot 7*2 = 14 -> yield 22 ; no patrons or
//   follows, so charge 22 and flow 22 + 22 = 44, counted at 44/2 = 22
//   flow (yield + charge): Ada 81+180 = 261 (vector (-3+200)/2 = 98.5 -> 99), Ben -4-4 = -8,
//     Dot 1000+997 = 1997
//   grand 261 + 0 (Ben's -8 counts as zero) + 1997 + 40 (Sol) + 22 = 2320

// Sol is shared from sheet S9 as row 8: counted here like anyone. Sol has no patrons or follows: momentum 10, torque 5,
// blend 15 (lift 15), pivot 5*1 = 5 -> yield 20, charge 20, flow 40.
// The anchor is 2026-03-01. Dot's beta becomes 21 from 2026-04-01: a change dated after the anchor does not count yet.
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
  sheets: [{ id: 'S9', people: [{ id: 1, name: 'Sol', alpha: 2, beta: 5, gamma: 2, delta: 1, epsilon: 5, zeta: 1, kind: 'A', active: true }] }],
  shares: [{ personId: 8, fromSheetId: 'S9', fromPersonId: 1 }],
  history: [{ personId: 3, field: 'beta', value: 21, from: '2026-04-01' }],
});
    await page.goto('/');

    await expect(page.getByTestId('person-row-4').getByTestId('concept-flow')).toHaveText('n/a');
    await expect(page.getByTestId('rollup-grand-flow')).toHaveText('2320');
  });
});
