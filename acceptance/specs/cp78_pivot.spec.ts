import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// pivot = torque * verge.
//   torque: Ada 33, Ben -2, Dot 100 ; verge: 1, 2, 4 -> pivot 33, -4, 400

test.describe('pivot', () => {
  test('pivot is torque times verge', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
  people: [
    { id: 1, name: 'Ada', alpha: 2, beta: 3,  gamma: 5, delta: 3, epsilon: 4,  zeta: 10, kind: 'A' },
    { id: 2, name: 'Ben', alpha: 4, beta: 2,  gamma: 1, delta: 5, epsilon: 2,  zeta: 1,  kind: 'B' },
    { id: 3, name: 'Dot', alpha: 5, beta: 20, gamma: 5, delta: 5, epsilon: 20, zeta: 5,  kind: 'C' },
  ],
});
    await page.goto('/');

    await expect(page.getByTestId('person-row-1').getByTestId('concept-pivot')).toHaveText('33');
    await expect(page.getByTestId('person-row-2').getByTestId('concept-pivot')).toHaveText('-4');
    await expect(page.getByTestId('person-row-3').getByTestId('concept-pivot')).toHaveText('400');
  });
});
