import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';


test.describe('stray count', () => {
  test('counts the strays on the sheet', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
  people: [
    { id: 1, name: 'Fay', alpha: 5,  beta: 8,  gamma: 5,  delta: 0, epsilon: 0, zeta: 0, active: true },
    { id: 2, name: 'Gus', alpha: 2,  beta: 30, gamma: 2,  delta: 0, epsilon: 0, zeta: 0, active: true },
    { id: 3, name: 'Hal', alpha: 8,  beta: 10, gamma: 8,  delta: 0, epsilon: 0, zeta: 0, active: true },
    { id: 4, name: 'Ivy', alpha: 4,  beta: 60, gamma: 4,  delta: 0, epsilon: 0, zeta: 0, active: true },
    { id: 5, name: 'Jo',  alpha: 10, beta: 90, gamma: 10, delta: 0, epsilon: 0, zeta: 0, active: true },
  ],
});
    await page.goto('/');

    await expect(page.getByTestId('rollup-stray-count')).toHaveText('4');
  });
});
