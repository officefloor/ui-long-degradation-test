import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// top brace rollup: name of the highest-brace person (ties by name asc).
// brace = influence + force; with no patrons influence is the person's own effective (= momentum).
//   Ada 15+12=27, Ben -1+10=9, Dot 100+100=200 -> Dot.
// Hela is on hold: left out of sheet-wide figures, so she is never the top name even with the
// highest brace (influence 1 + force 300).

test.describe('top brace', () => {
  test('names the highest-brace person', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
  people: [
    { id: 1, name: 'Ada', alpha: 2, beta: 3,  gamma: 5, delta: 3, epsilon: 4,  zeta: 10, active: true },
    { id: 2, name: 'Ben', alpha: 4, beta: 2,  gamma: 1, delta: 5, epsilon: 2,  zeta: 1,  active: true },
    { id: 3, name: 'Dot', alpha: 5, beta: 20, gamma: 5, delta: 5, epsilon: 20, zeta: 5,  active: true },
    { id: 9, name: 'Hela', alpha: 1, beta: 1,  gamma: 1, delta: 10, epsilon: 30, zeta: 10, active: true, hold: true },
  ],
});
    await page.goto('/');

    await expect(page.getByTestId('rollup-top-brace')).toHaveText('Dot');
  });

  // Tie-break: identical inputs give equal brace (influence + force), so the alphabetical
  // tie-break decides. Bob is seeded first / lower id to prove it is name order, not seed order.
  //   each: momentum 1 -> influence 1; force 1; brace 1 + 1 = 2
  // Hela is on hold and has a higher brace (force 1*2=2, brace 1+2=3), but is left out of the top name.
  test('breaks a brace tie alphabetically', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      people: [
        { id: 1, name: 'Bob', alpha: 1, beta: 1, gamma: 1, delta: 1, epsilon: 1, zeta: 1, active: true }, // brace 2
        { id: 2, name: 'Ana', alpha: 1, beta: 1, gamma: 1, delta: 1, epsilon: 1, zeta: 1, active: true }, // brace 2
        { id: 9, name: 'Hela', alpha: 1, beta: 1, gamma: 1, delta: 1, epsilon: 2, zeta: 1, active: true, hold: true }, // on hold
      ],
    });
    await page.goto('/');

    await expect(page.getByTestId('rollup-top-brace')).toHaveText('Ana');
  });
});
