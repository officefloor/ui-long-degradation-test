import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// max thrum rollup: the name of the person with the highest thrum (ties by name asc). Dot 300.

test.describe('max thrum', () => {
  test('names the highest-thrum person', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
  people: [
    { id: 1, name: 'Ada', alpha: 2, beta: 3,  gamma: 5, delta: 3, epsilon: 4,  zeta: 10, active: true },
    { id: 2, name: 'Ben', alpha: 4, beta: 2,  gamma: 1, delta: 5, epsilon: 2,  zeta: 1,  active: true },
    { id: 3, name: 'Dot', alpha: 5, beta: 20, gamma: 5, delta: 5, epsilon: 20, zeta: 5,  active: true },
  ],
});
    await page.goto('/');

    await expect(page.getByTestId('rollup-max-thrum')).toHaveText('Dot');
  });

  // Tie-break: identical inputs give equal thrum (scaled + 2*torque), so the alphabetical tie-break
  // decides. Bob is seeded first / lower id to prove it is name order, not seed order.
  //   each: momentum 1 -> adjusted 1 -> band D x1 -> scaled 1; torque 1; thrum 1 + 2*1 = 3
  test('breaks a thrum tie alphabetically', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      people: [
        { id: 1, name: 'Bob', alpha: 1, beta: 1, gamma: 1, delta: 1, epsilon: 1, zeta: 1, active: true }, // thrum 3
        { id: 2, name: 'Ana', alpha: 1, beta: 1, gamma: 1, delta: 1, epsilon: 1, zeta: 1, active: true }, // thrum 3
      ],
    });
    await page.goto('/');

    await expect(page.getByTestId('rollup-max-thrum')).toHaveText('Ana');
  });
});
