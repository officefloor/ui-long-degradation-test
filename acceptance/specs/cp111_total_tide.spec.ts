import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// total tide rollup: sum of tides (skip n/a). 260 + 0 + 19 + 0 = 279.
// Nil's delta is missing -> force n/a -> brace n/a; Nil follows nobody so Nil's own tide is 0.
// Xan follows Nil, so Xan's tide (sum of followed brace) is n/a and Xan is skipped -> total stays 279.

test.describe('total tide', () => {
  test('total tide sums the tides', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
  people: [
    { id: 1, name: 'Ada', alpha: 2, beta: 3,  gamma: 5, delta: 3,    epsilon: 4,   zeta: 10, active: true },
    { id: 2, name: 'Ben', alpha: 4, beta: 2,  gamma: 1, delta: 5,    epsilon: 2,   zeta: 1,  active: true },
    { id: 3, name: 'Dot', alpha: 5, beta: 20, gamma: 5, delta: 5,    epsilon: 20,  zeta: 5,  active: true },
    { id: 4, name: 'Gus', alpha: 1, beta: 1,  gamma: 1, delta: 1,    epsilon: -30, zeta: 1,  active: true },
    { id: 5, name: 'Nil', alpha: 1, beta: 1,  gamma: 1, delta: null, epsilon: 1,   zeta: 1,  active: true }, // brace n/a; follows nobody -> tide 0
    { id: 6, name: 'Xan', alpha: 1, beta: 1,  gamma: 1, delta: 1,    epsilon: 1,   zeta: 1,  active: true }, // follows Nil -> tide n/a -> skipped
  ],
  follows: [
    { from: 1, to: 2 }, { from: 1, to: 3 }, { from: 1, to: 4 },
    { from: 3, to: 2 },
    { from: 6, to: 5 },
  ],
});
    await page.goto('/');

    await expect(page.getByTestId('person-row-6').getByTestId('concept-tide')).toHaveText('n/a');
    await expect(page.getByTestId('rollup-total-tide')).toHaveText('279');
  });
});
