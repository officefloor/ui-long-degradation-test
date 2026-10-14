import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// top influence rollup: the name of the highest-influence person (ties by name asc).
//   influence: Uma 100, Ivo 60, Dana 233, Kai 275 -> Kai

test.describe('top influence', () => {
  test('names the highest-influence person', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
  people: [
    { id: 1, name: 'Uma',  alpha: 5, beta: 20, gamma: 5,  active: true },
    { id: 2, name: 'Ivo',  alpha: 2, beta: 30, gamma: 2,  active: true },
    { id: 3, name: 'Dana', alpha: 3, beta: 4,  gamma: 10, active: true },
    { id: 4, name: 'Kai',  alpha: 2, beta: 5,  gamma: 2,  active: true },
  ],
  patrons: [
    { personId: 3, patronId: 1 },
    { personId: 4, patronId: 3 }, { personId: 4, patronId: 2 },
  ],
});
    await page.goto('/');

    await expect(page.getByTestId('rollup-top-influence')).toHaveText('Kai');
  });
});
