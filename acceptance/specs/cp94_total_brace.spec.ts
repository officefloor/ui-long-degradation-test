import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// total brace rollup: sum of braces (skip n/a), a negative brace counting as zero. 27 + 9 + 200 = 236.
// Hela is on hold: left out of sheet-wide figures, counted at half in totals.
//   Hela influence 1, force 9 -> brace 10, counts 10/2 = 5 ; total 236 + 5 = 241

test.describe('total brace', () => {
  test('total brace sums the braces', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
  people: [
    { id: 1, name: 'Ada', alpha: 2, beta: 3,  gamma: 5, delta: 3, epsilon: 4,  zeta: 10, active: true },
    { id: 2, name: 'Ben', alpha: 4, beta: 2,  gamma: 1, delta: 5, epsilon: 2,  zeta: 1,  active: true },
    { id: 3, name: 'Dot', alpha: 5, beta: 20, gamma: 5, delta: 5, epsilon: 20, zeta: 5,  active: true },
    // Nil's delta is missing -> force n/a -> brace n/a, so Nil is skipped (adds nothing).
    { id: 4, name: 'Nil', alpha: 1, beta: 1, gamma: 1, delta: null, epsilon: 1, zeta: 1, active: true },
    { id: 9, name: 'Hela', alpha: 1, beta: 1, gamma: 1, delta: 1, epsilon: 9, zeta: 1, active: true, hold: true },
  ],
});
    await page.goto('/');

    await expect(page.getByTestId('person-row-4').getByTestId('concept-brace')).toHaveText('n/a');
    await expect(page.getByTestId('rollup-total-brace')).toHaveText('241');
  });
});
