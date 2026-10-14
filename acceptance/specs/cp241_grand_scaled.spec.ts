import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// Whole-stack sweep: grand scaled = sum of every person's scaled. Bare roster (active, no
// patrons/allies/score), so adjusted = momentum and scaled = momentum * band multiplier (cp52 bands).
//   Ada mom60 D x1 =60, Ben 120 C x2 =240, Cam 300 B x3 =900, Dot 45 D x1 =45 ; sum 1245
const SEED = {
  people: [
    { id: 1, name: 'Ada', alpha: 2,  beta: 30, gamma: 2,  active: true }, // scaled 60
    { id: 2, name: 'Ben', alpha: 4,  beta: 30, gamma: 4,  active: true }, // scaled 240
    { id: 3, name: 'Cam', alpha: 10, beta: 30, gamma: 10, active: true }, // scaled 900
    { id: 4, name: 'Dot', alpha: 3,  beta: 15, gamma: 3,  active: true }, // scaled 45
  ],
};

test.describe('grand scaled', () => {
  test('sums every scaled', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed(SEED);
    await page.goto('/');
    await page.getByTestId('nav-worksheet').click();
    await expect(page.getByTestId('rollup-grand-scaled')).toHaveText('1245');
  });
});
