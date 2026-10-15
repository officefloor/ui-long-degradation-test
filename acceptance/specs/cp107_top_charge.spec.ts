import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// top charge rollup: name of the highest-charge person (ties by name asc). Dot 1697.

test.describe('top charge', () => {
  test('names the highest-charge person', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
  people: [
    { id: 1, name: 'Ada', alpha: 2, beta: 3,  gamma: 5, delta: 3, epsilon: 4,  zeta: 10, kind: 'A', region: 'N1', active: true },
    { id: 2, name: 'Ben', alpha: 4, beta: 2,  gamma: 1, delta: 5, epsilon: 2,  zeta: 1,  kind: 'B', region: 'S2', active: true },
    { id: 3, name: 'Dot', alpha: 5, beta: 20, gamma: 5, delta: 5, epsilon: 20, zeta: 5,  kind: 'C', region: 'E5', active: true },
  ],
  patrons: [
    { personId: 1, patronId: 2 }, { personId: 1, patronId: 3 },
    { personId: 3, patronId: 2 },
  ],
  regions: [
    { personId: 1, region: 'N1' }, { personId: 2, region: 'S2' }, { personId: 3, region: 'E5' },
  ],
});
    await page.goto('/');

    await expect(page.getByTestId('rollup-top-charge')).toHaveText('Dot');
  });

  // Tie-break: identical inputs give equal charge, so the alphabetical tie-break decides. Bob is
  // seeded first / lower id to prove it is name order, not seed order.
  //   each: torque 1; verge A=2 -> pivot 2; blend 2 -> drag L1 x1 -> lift 2; yield 2 + 2*2 = 6
  //   no patrons -> vector 0; charge 0 + 6 = 6
  test('breaks a charge tie alphabetically', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      people: [
        { id: 1, name: 'Bob', alpha: 1, beta: 1, gamma: 1, delta: 1, epsilon: 1, zeta: 1, kind: 'A', active: true }, // charge 6
        { id: 2, name: 'Ana', alpha: 1, beta: 1, gamma: 1, delta: 1, epsilon: 1, zeta: 1, kind: 'A', active: true }, // charge 6
      ],
    });
    await page.goto('/');

    await expect(page.getByTestId('rollup-top-charge')).toHaveText('Ana');
  });
});
