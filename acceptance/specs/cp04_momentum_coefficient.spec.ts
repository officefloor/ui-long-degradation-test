import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

test.describe('momentum coefficient raised to 3', () => {
  test('momentum is thrust + 3*drift', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      people: [
        // thrust 12, drift 7,  momentum 12 + 3*7  = 33
        { id: 1, name: 'Dana', alpha: 3, beta: 4, gamma: 10 },
        // thrust 14, drift -2, momentum 14 + 3*-2 = 8
        { id: 2, name: 'Ravi', alpha: 7, beta: 2, gamma: 5 },
      ],
    });
    await page.goto('/');

    // drift unchanged
    await expect(page.getByTestId('person-row-1').getByTestId('concept-drift')).toHaveText('7');
    await expect(page.getByTestId('person-row-2').getByTestId('concept-drift')).toHaveText('-2');
    // momentum now uses coefficient 3
    await expect(page.getByTestId('person-row-1').getByTestId('concept-momentum')).toHaveText('33');
    await expect(page.getByTestId('person-row-2').getByTestId('concept-momentum')).toHaveText('8');
  });
});
