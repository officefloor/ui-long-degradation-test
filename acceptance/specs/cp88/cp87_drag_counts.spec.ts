import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// Hela is on hold: left out of sheet-wide figures, so of the counts too.
//   Hela blend 50 + 200 = 250 -> L3, not counted (L3 stays 2)

test.describe('drag counts', () => {
  test('counts people per drag level', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
  people: [
    { id: 1, name: 'Ada', alpha: 2, beta: 3,  gamma: 5, delta: 3, epsilon: 4,  zeta: 10, active: true },
    { id: 2, name: 'Ben', alpha: 4, beta: 2,  gamma: 1, delta: 5, epsilon: 2,  zeta: 1,  active: true },
    { id: 3, name: 'Dot', alpha: 5, beta: 20, gamma: 5, delta: 5, epsilon: 20, zeta: 5,  active: true },
    { id: 4, name: 'Max', alpha: 5, beta: 10, gamma: 5, delta: 5, epsilon: 20, zeta: 5,  active: true },
    { id: 9, name: 'Hela', alpha: 5, beta: 10, gamma: 5, delta: 5, epsilon: 40, zeta: 5,  active: true, hold: true },
  ],
});
    await page.goto('/');

    await expect(page.getByTestId('drag-count-L0')).toHaveText('1');
    await expect(page.getByTestId('drag-count-L1')).toHaveText('1');
    await expect(page.getByTestId('drag-count-L2')).toHaveText('0');
    await expect(page.getByTestId('drag-count-L3')).toHaveText('2');
  });
});
