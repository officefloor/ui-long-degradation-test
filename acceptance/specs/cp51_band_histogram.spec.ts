import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// Band histogram: how many people are in each band A..E, shown at `band-count-<X>`. A band with
// nobody in it shows 0.

test.describe('band histogram', () => {
  test('counts people per band', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
  people: [
    { id: 1, name: 'Ed', alpha: 3,  beta: 1,  gamma: 0,  active: true }, // -6  -> E
    { id: 2, name: 'Di', alpha: 5,  beta: 6,  gamma: 5,  active: true }, // 30  -> D
    { id: 3, name: 'Cy', alpha: 5,  beta: 20, gamma: 5,  active: true }, // 100 -> C
    { id: 4, name: 'Cz', alpha: 4,  beta: 30, gamma: 4,  active: true }, // 120 -> C
    { id: 5, name: 'Bo', alpha: 10, beta: 20, gamma: 10, active: true }, // 200 -> B
  ],
});
    await page.goto('/');

    await expect(page.getByTestId('band-count-A')).toHaveText('0'); // nobody reaches band A
    await expect(page.getByTestId('band-count-B')).toHaveText('1');
    await expect(page.getByTestId('band-count-C')).toHaveText('2');
    await expect(page.getByTestId('band-count-D')).toHaveText('1');
    await expect(page.getByTestId('band-count-E')).toHaveText('1');
  });
});
