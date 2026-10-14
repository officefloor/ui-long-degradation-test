import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// grand flow rollup: sum of flows (skip n/a). 741 + -12 + 3416 = 4145.

test.describe('grand flow', () => {
  test('grand flow sums the flows', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
  people: [
    { id: 1, name: 'Ada', alpha: 2, beta: 3,  gamma: 5, delta: 3, epsilon: 4,  zeta: 10, kind: 'A', active: true },
    { id: 2, name: 'Ben', alpha: 4, beta: 2,  gamma: 1, delta: 5, epsilon: 2,  zeta: 1,  kind: 'B', active: true },
    { id: 3, name: 'Dot', alpha: 5, beta: 20, gamma: 5, delta: 5, epsilon: 20, zeta: 5,  kind: 'C', active: true },
  ],
  patrons: [
    { personId: 1, patronId: 2 }, { personId: 1, patronId: 3 },
    { personId: 3, patronId: 2 },
  ],
  follows: [
    { from: 1, to: 2 }, { from: 1, to: 3 },
    { from: 3, to: 2 },
  ],
});
    await page.goto('/');

    await expect(page.getByTestId('rollup-grand-flow')).toHaveText('4145');
  });
});
