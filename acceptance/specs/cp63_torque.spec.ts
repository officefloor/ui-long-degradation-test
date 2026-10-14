import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// zeta (whole number). sway = zeta - delta. torque = force + 2*sway.
test.describe('sway and torque', () => {
  test('sway and torque build on force', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      people: [
        // force 12, sway 10-3=7,  torque 12 + 2*7  = 26
        { id: 1, name: 'Ada', alpha: 2, beta: 3, gamma: 5, delta: 3, epsilon: 4, zeta: 10 },
        // force 10, sway 1-5=-4, torque 10 + 2*-4 = 2
        { id: 2, name: 'Ben', alpha: 4, beta: 2, gamma: 1, delta: 5, epsilon: 2, zeta: 1 },
      ],
    });
    await page.goto('/');

    await expect(page.getByTestId('person-row-1').getByTestId('concept-sway')).toHaveText('7');
    await expect(page.getByTestId('person-row-1').getByTestId('concept-torque')).toHaveText('26');
    await expect(page.getByTestId('person-row-2').getByTestId('concept-sway')).toHaveText('-4');
    await expect(page.getByTestId('person-row-2').getByTestId('concept-torque')).toHaveText('2');
  });
});
