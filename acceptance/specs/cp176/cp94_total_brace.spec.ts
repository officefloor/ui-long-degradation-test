import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// Hela is on hold: left out of sheet-wide figures, counted at half in totals.
//   Hela brace 1 + 2*9 = 19, counts 19/2 = 9.5 -> 10 (to the nearest, a half rounding up) ;
//   Nil has no delta, which counts as 0: force 0, influence 1 -> brace 1
//   Sol (shared): force 1*5 = 5, influence 1 -> brace 1 + 2*5 = 11
//   total 358 + 1 + 10 + 11 = 380

test.describe('total brace', () => {
  test('total brace sums the braces', { tag: '@functionality' }, async ({ page }) => {
    // Sol is shared from sheet S9: counted here like anyone
    // a change dated after the anchor does not count yet (Dot's beta 40 from 2026-04-01)
    await resetAndSeed({
  anchor: '2026-03-01',
  sheets: [
    { id: 'S9', people: [{ id: 1, name: 'Sol', alpha: 1, beta: 1, gamma: 1, delta: 1, epsilon: 5, zeta: 1, active: true }] },
  ],
  shares: [{ personId: 8, fromSheetId: 'S9', fromPersonId: 1 }],
  history: [{ personId: 3, field: 'beta', value: 40, from: '2026-04-01' }],
  people: [
    { id: 1, name: 'Ada', alpha: 2, beta: 3,  gamma: 5, delta: 3, epsilon: 4,  zeta: 10, active: true },
    { id: 2, name: 'Ben', alpha: 4, beta: 2,  gamma: 1, delta: 5, epsilon: 2,  zeta: 1,  active: true },
    { id: 3, name: 'Dot', alpha: 5, beta: 20, gamma: 5, delta: 5, epsilon: 20, zeta: 5,  active: true },
    // Nil's delta is missing, so it counts as 0 -> brace 1.
    { id: 4, name: 'Nil', alpha: 1, beta: 1, gamma: 1, delta: null, epsilon: 1, zeta: 1, active: true },
    { id: 9, name: 'Hela', alpha: 1, beta: 1, gamma: 1, delta: 1, epsilon: 9, zeta: 1, active: true, hold: true },
  ],
});
    await page.goto('/');

    await expect(page.getByTestId('person-row-4').getByTestId('concept-brace')).toHaveText('1');
    await expect(page.getByTestId('rollup-total-brace')).toHaveText('380');
  });
});
