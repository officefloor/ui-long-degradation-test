import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// grand influence = sum of every influence. With no patrons, influence = effective = momentum.
//   Ada 60, Ben 120, Cam 300, Dot 45 ; sum 525
const SEED = {
  people: [
    { id: 1, name: 'Ada', alpha: 2,  beta: 30, gamma: 2,  active: true },
    { id: 2, name: 'Ben', alpha: 4,  beta: 30, gamma: 4,  active: true },
    { id: 3, name: 'Cam', alpha: 10, beta: 30, gamma: 10, active: true },
    { id: 4, name: 'Dot', alpha: 3,  beta: 15, gamma: 3,  active: true },
  ],
};

test.describe('grand influence', () => {
  test('sums every influence', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed(SEED);
    await page.goto('/');
    await page.getByTestId('nav-worksheet').click();
    await expect(page.getByTestId('rollup-grand-influence')).toHaveText('525');
  });
});
