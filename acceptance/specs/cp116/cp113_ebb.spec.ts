import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../../support/seed';

// UPDATED PRIOR shipped by cp116 (mutates cp113). ebb = blend - mean(blend) floor (mean 264).
const SEED = {
  people: [
    { id: 1, name: 'Fay', alpha: 5,  beta: 8,  gamma: 5,  delta: 0, epsilon: 0, zeta: 0, active: true },
    { id: 2, name: 'Gus', alpha: 2,  beta: 30, gamma: 2,  delta: 0, epsilon: 0, zeta: 0, active: true },
    { id: 3, name: 'Hal', alpha: 8,  beta: 10, gamma: 8,  delta: 0, epsilon: 0, zeta: 0, active: true },
    { id: 4, name: 'Ivy', alpha: 4,  beta: 60, gamma: 4,  delta: 0, epsilon: 0, zeta: 0, active: true },
    { id: 5, name: 'Jo',  alpha: 10, beta: 90, gamma: 10, delta: 0, epsilon: 0, zeta: 0, active: true },
  ],
};

test.describe('ebb', () => {
  test('ebb is blend minus the mean blend', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed(SEED);
    await page.goto('/');
    await page.getByTestId('nav-worksheet').click();

    await expect(page.getByTestId('person-row-1').getByTestId('concept-ebb')).toHaveText('-224');
    await expect(page.getByTestId('person-row-2').getByTestId('concept-ebb')).toHaveText('-204');
    await expect(page.getByTestId('person-row-3').getByTestId('concept-ebb')).toHaveText('-184');
    await expect(page.getByTestId('person-row-4').getByTestId('concept-ebb')).toHaveText('-24');
    await expect(page.getByTestId('person-row-5').getByTestId('concept-ebb')).toHaveText('636');
  });
});
