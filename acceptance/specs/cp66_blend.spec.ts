import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// blend fuses the two axes: blend = momentum + torque.
test.describe('blend', () => {
  test('blend is momentum plus torque', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      people: [
        // momentum 6+3*3=15, torque 33 -> blend 48
        { id: 1, name: 'Ada', alpha: 2, beta: 3,  gamma: 5, delta: 3, epsilon: 4,  zeta: 10 },
        // momentum 8+3*-3=-1, torque -2 -> blend -3
        { id: 2, name: 'Ben', alpha: 4, beta: 2,  gamma: 1, delta: 5, epsilon: 2,  zeta: 1 },
        // momentum 100, torque 100 -> blend 200
        { id: 3, name: 'Dot', alpha: 5, beta: 20, gamma: 5, delta: 5, epsilon: 20, zeta: 5 },
      ],
    });
    await page.goto('/');

    await expect(page.getByTestId('person-row-1').getByTestId('concept-blend')).toHaveText('48');
    await expect(page.getByTestId('person-row-2').getByTestId('concept-blend')).toHaveText('-3');
    await expect(page.getByTestId('person-row-3').getByTestId('concept-blend')).toHaveText('200');
  });
});
