import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// drag from blend: below 0 L0, 0..49 L1, 50..149 L2, 150 or more L3.
//   blend (momentum + torque): Ada 15+33=48 -> L1, Ben -1-2=-3 -> L0,
//   Dot 100+100=200 -> L3, Max 50+100=150 -> L3

test.describe('drag', () => {
  test('drag classifies blend into four levels', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
  people: [
    { id: 1, name: 'Ada', alpha: 2, beta: 3,  gamma: 5, delta: 3, epsilon: 4,  zeta: 10, active: true },
    { id: 2, name: 'Ben', alpha: 4, beta: 2,  gamma: 1, delta: 5, epsilon: 2,  zeta: 1,  active: true },
    { id: 3, name: 'Dot', alpha: 5, beta: 20, gamma: 5, delta: 5, epsilon: 20, zeta: 5,  active: true },
    { id: 4, name: 'Max', alpha: 5, beta: 10, gamma: 5, delta: 5, epsilon: 20, zeta: 5,  active: true },
  ],
});
    await page.goto('/');

    await expect(page.getByTestId('person-row-1').getByTestId('concept-drag')).toHaveText('L1');
    await expect(page.getByTestId('person-row-2').getByTestId('concept-drag')).toHaveText('L0');
    await expect(page.getByTestId('person-row-3').getByTestId('concept-drag')).toHaveText('L3');
    await expect(page.getByTestId('person-row-4').getByTestId('concept-drag')).toHaveText('L3');
  });
});
