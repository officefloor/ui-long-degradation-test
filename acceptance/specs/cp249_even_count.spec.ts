import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// even scaled count: scaled 60, 240, 900 are even; 45 is odd -> 3 even.
const SEED = {
  people: [
    { id: 1, name: 'Ada', alpha: 2,  beta: 30, gamma: 2,  active: true }, // 60 even
    { id: 2, name: 'Ben', alpha: 4,  beta: 30, gamma: 4,  active: true }, // 240 even
    { id: 3, name: 'Cam', alpha: 10, beta: 30, gamma: 10, active: true }, // 900 even
    { id: 4, name: 'Dot', alpha: 3,  beta: 15, gamma: 3,  active: true }, // 45 odd
  ],
};

test.describe('even scaled count', () => {
  test('counts people whose scaled is even', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed(SEED);
    await page.goto('/');
    await page.getByTestId('nav-worksheet').click();
    await expect(page.getByTestId('rollup-even-count')).toHaveText('3');
  });
});
