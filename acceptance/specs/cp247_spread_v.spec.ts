import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// scaled spread = highest scaled - lowest scaled = 900 - 45 = 855.
const SEED = {
  people: [
    { id: 1, name: 'Ada', alpha: 2,  beta: 30, gamma: 2,  active: true }, // 60
    { id: 2, name: 'Ben', alpha: 4,  beta: 30, gamma: 4,  active: true }, // 240
    { id: 3, name: 'Cam', alpha: 10, beta: 30, gamma: 10, active: true }, // 900
    { id: 4, name: 'Dot', alpha: 3,  beta: 15, gamma: 3,  active: true }, // 45
  ],
};

test.describe('scaled spread', () => {
  test('spread is max scaled minus min scaled', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed(SEED);
    await page.goto('/');
    await page.getByTestId('nav-worksheet').click();
    await expect(page.getByTestId('rollup-spread-v')).toHaveText('855');
  });
});
