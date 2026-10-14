import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../../support/seed';

// UPDATED PRIOR shipped by cp88 (mutates cp85). drag: L0 (<0), L1 (0..49), L2 (50..149), L3 (>=150).
const SEED = {
  people: [
    { id: 1, name: 'Ada', alpha: 2, beta: 3,  gamma: 5, delta: 3, epsilon: 4,  zeta: 10, active: true },
    { id: 2, name: 'Ben', alpha: 4, beta: 2,  gamma: 1, delta: 5, epsilon: 2,  zeta: 1,  active: true },
    { id: 3, name: 'Dot', alpha: 5, beta: 20, gamma: 5, delta: 5, epsilon: 20, zeta: 5,  active: true },
    { id: 4, name: 'Max', alpha: 5, beta: 10, gamma: 5, delta: 5, epsilon: 20, zeta: 5,  active: true },
  ],
};

test.describe('drag', () => {
  test('drag classifies blend into four levels', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed(SEED);
    await page.goto('/');
    await page.getByTestId('nav-worksheet').click();

    await expect(page.getByTestId('person-row-1').getByTestId('concept-drag')).toHaveText('L1');
    await expect(page.getByTestId('person-row-2').getByTestId('concept-drag')).toHaveText('L0');
    await expect(page.getByTestId('person-row-3').getByTestId('concept-drag')).toHaveText('L3');
    await expect(page.getByTestId('person-row-4').getByTestId('concept-drag')).toHaveText('L3');
  });
});
