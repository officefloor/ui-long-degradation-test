import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// pulse counts across the sheet, shown at `pulse-count-<P>`. POS 1, NEG 2, FLAT 1.
const SEED = {
  people: [
    { id: 1, name: 'Ada', alpha: 2, beta: 3,  gamma: 5, delta: 3, epsilon: 4,  zeta: 10, active: true },
    { id: 2, name: 'Ben', alpha: 4, beta: 2,  gamma: 1, delta: 5, epsilon: 2,  zeta: 1,  active: true },
    { id: 3, name: 'Dot', alpha: 5, beta: 20, gamma: 5, delta: 5, epsilon: 20, zeta: 5,  active: true },
    { id: 4, name: 'Eve', alpha: 2, beta: 3,  gamma: 5, delta: 2, epsilon: 3,  zeta: 4,  active: true },
  ],
};

test.describe('pulse counts', () => {
  test('counts people per pulse value', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed(SEED);
    await page.goto('/');
    await page.getByTestId('nav-worksheet').click();

    await expect(page.getByTestId('pulse-count-POS')).toHaveText('1');
    await expect(page.getByTestId('pulse-count-NEG')).toHaveText('2');
    await expect(page.getByTestId('pulse-count-FLAT')).toHaveText('1');
  });
});
