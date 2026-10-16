import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// Hela is on hold: left out of sheet-wide figures, counted at half in totals.
//   Hela brace 1 + 2*9 = 19, counts 19/2 = 9.5 -> 10 (to the nearest, a half rounding up) ;
//   total 358 + 20 (Sol) + 10 = 388

// Sol is shared from sheet S9 as row 8: counted here like anyone. Sol: influence 10 (momentum 10, no patrons), force 5, brace 10 + 2*5 = 20.
// The anchor is 2026-03-01. Dot's beta becomes 21 from 2026-04-01: a change dated after the anchor does not count yet.
test.describe('total brace', () => {
  test('total brace sums the braces', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
  anchor: '2026-03-01',
  people: [
    { id: 1, name: 'Ada', alpha: 2, beta: 3,  gamma: 5, delta: 3, epsilon: 4,  zeta: 10, active: true },
    { id: 2, name: 'Ben', alpha: 4, beta: 2,  gamma: 1, delta: 5, epsilon: 2,  zeta: 1,  active: true },
    { id: 3, name: 'Dot', alpha: 5, beta: 20, gamma: 5, delta: 5, epsilon: 20, zeta: 5,  active: true },
    // Nil's delta is missing -> force n/a -> brace n/a, so Nil is skipped (adds nothing).
    { id: 4, name: 'Nil', alpha: 1, beta: 1, gamma: 1, delta: null, epsilon: 1, zeta: 1, active: true },
    { id: 9, name: 'Hela', alpha: 1, beta: 1, gamma: 1, delta: 1, epsilon: 9, zeta: 1, active: true, hold: true },
  ],
  sheets: [{ id: 'S9', people: [{ id: 1, name: 'Sol', alpha: 2, beta: 5, gamma: 2, delta: 1, epsilon: 5, zeta: 1, active: true }] }],
  shares: [{ personId: 8, fromSheetId: 'S9', fromPersonId: 1 }],
  history: [{ personId: 3, field: 'beta', value: 21, from: '2026-04-01' }],
});
    await page.goto('/');

    await expect(page.getByTestId('person-row-4').getByTestId('concept-brace')).toHaveText('n/a');
    await expect(page.getByTestId('rollup-total-brace')).toHaveText('388');
  });
});
