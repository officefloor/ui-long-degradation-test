import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../../support/seed';


test.describe('total haul', () => {
  test('total haul sums the hauls', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
  people: [
    { id: 1, name: 'Ada', alpha: 2, beta: 3,  gamma: 5, delta: 3, epsilon: 4,  zeta: 10 },
    { id: 2, name: 'Ben', alpha: 4, beta: 2,  gamma: 1, delta: 5, epsilon: 2,  zeta: 1 },
    { id: 3, name: 'Dot', alpha: 5, beta: 20, gamma: 5, delta: 5, epsilon: 20, zeta: 5 },
    // Nil's delta is missing -> force/torque/blend/crest/haul are n/a, so Nil is skipped (total stays 345).
    { id: 4, name: 'Nil', alpha: 1, beta: 1, gamma: 1, delta: null, epsilon: 1, zeta: 1 },
  ],
  follows: [
    { from: 1, to: 2 }, { from: 1, to: 3 },
    { from: 3, to: 2 },
  ],
});
    await page.goto('/');

    await expect(page.getByTestId('person-row-4').getByTestId('concept-haul')).toHaveText('n/a');
    await expect(page.getByTestId('rollup-total-haul')).toHaveText('345');
  });
});
