import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// top crest rollup: name of the person with the highest crest (ties by name asc). Dot 210.

test.describe('top crest', () => {
  test('names the highest-crest person', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
  people: [
    { id: 1, name: 'Ada', alpha: 2, beta: 3,  gamma: 5, delta: 3, epsilon: 4,  zeta: 10 },
    { id: 2, name: 'Ben', alpha: 4, beta: 2,  gamma: 1, delta: 5, epsilon: 2,  zeta: 1 },
    { id: 3, name: 'Dot', alpha: 5, beta: 20, gamma: 5, delta: 5, epsilon: 20, zeta: 5 },
  ],
  patrons: [
    { personId: 1, patronId: 2 }, { personId: 1, patronId: 3 },
    { personId: 3, patronId: 2 },
  ],
});
    await page.goto('/');

    await expect(page.getByTestId('rollup-top-crest')).toHaveText('Dot');
  });

  // Tie-break: two people with identical inputs have equal crest, so the request's alphabetical
  // tie-break decides. Bob is seeded first / lower id to prove it is name order, not seed order.
  //   each: thrust 1, drift 0, momentum 1; force 1, sway 0, torque 1; blend 2; no patrons -> flux 0; crest 2
  test('breaks a crest tie alphabetically', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      people: [
        { id: 1, name: 'Bob', alpha: 1, beta: 1, gamma: 1, delta: 1, epsilon: 1, zeta: 1, active: true }, // crest 2
        { id: 2, name: 'Ana', alpha: 1, beta: 1, gamma: 1, delta: 1, epsilon: 1, zeta: 1, active: true }, // crest 2
      ],
    });
    await page.goto('/');

    await expect(page.getByTestId('rollup-top-crest')).toHaveText('Ana');
  });
});
