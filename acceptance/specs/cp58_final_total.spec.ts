import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// final total rollup: the sum of scaled over only the people whose state is FINAL.
//   Al mom100 -> scaled 200 (FINAL), Bea mom300 -> scaled 900 (FINAL), Cal mom60 -> scaled 60 (DRAFT, excluded)
//   final total = 200 + 900 = 1100

test.describe('final total', () => {
  test('final total sums scaled of FINAL people only', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
  people: [
    { id: 1, name: 'Al',  alpha: 5,  beta: 20, gamma: 5,  active: true, state: 'FINAL' },
    { id: 2, name: 'Bea', alpha: 10, beta: 30, gamma: 10, active: true, state: 'FINAL' },
    { id: 3, name: 'Cal', alpha: 2,  beta: 30, gamma: 2,  active: true, state: 'DRAFT' },
  ],
});
    await page.goto('/');

    await expect(page.getByTestId('rollup-final-total')).toHaveText('1100');
  });
});
