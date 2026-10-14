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
});
