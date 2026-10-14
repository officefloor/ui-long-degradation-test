import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// outlier count rollup across the whole sheet (mean-based norms -> 4 outliers).

test.describe('outlier count', () => {
  test('counts the outliers on the sheet', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
  people: [
    { id: 1, name: 'Fay', alpha: 5,  beta: 8,  gamma: 5,  active: true },
    { id: 2, name: 'Gus', alpha: 2,  beta: 30, gamma: 2,  active: true },
    { id: 3, name: 'Hal', alpha: 8,  beta: 10, gamma: 8,  active: true },
    { id: 4, name: 'Ivy', alpha: 4,  beta: 30, gamma: 4,  active: true },
    { id: 5, name: 'Jo',  alpha: 10, beta: 30, gamma: 10, active: true },
  ],
});
    await page.goto('/');

    await expect(page.getByTestId('rollup-outlier-count')).toHaveText('4');
  });
});
