import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// MUTATIVE (mutates cp63): torque is now force + 3*sway (was 2*sway). sway and force unchanged.
// Updated cp63 ships under acceptance/specs/cp64/.
test.describe('torque coefficient raised to 3', () => {
  test('torque is force + 3*sway', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      people: [
        { id: 1, name: 'Ada', alpha: 2, beta: 3, gamma: 5, delta: 3, epsilon: 4, zeta: 10 }, // 12 + 3*7 = 33
        { id: 2, name: 'Ben', alpha: 4, beta: 2, gamma: 1, delta: 5, epsilon: 2, zeta: 1 },  // 10 + 3*-4 = -2
      ],
    });
    await page.goto('/');
    await page.getByTestId('nav-worksheet').click();

    await expect(page.getByTestId('person-row-1').getByTestId('concept-sway')).toHaveText('7');
    await expect(page.getByTestId('person-row-2').getByTestId('concept-sway')).toHaveText('-4');
    await expect(page.getByTestId('person-row-1').getByTestId('concept-torque')).toHaveText('33');
    await expect(page.getByTestId('person-row-2').getByTestId('concept-torque')).toHaveText('-2');
  });
});
