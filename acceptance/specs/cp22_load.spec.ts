import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// load = momentum * weight.
test.describe('load', () => {
  test('load is momentum times weight', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      people: [
        { id: 1, name: 'Dana', alpha: 3, beta: 4,  gamma: 10, grade: 'HIGH' }, // momentum 33, weight 3 -> 99
        { id: 2, name: 'Ravi', alpha: 7, beta: 2,  gamma: 5,  grade: 'MID' },  // momentum 8,  weight 2 -> 16
        { id: 3, name: 'Uma',  alpha: 5, beta: 20, gamma: 5,  grade: 'LOW' },  // momentum 100, weight 1 -> 100
      ],
    });
    await page.goto('/');

    await expect(page.getByTestId('person-row-1').getByTestId('concept-load')).toHaveText('99');
    await expect(page.getByTestId('person-row-2').getByTestId('concept-load')).toHaveText('16');
    await expect(page.getByTestId('person-row-3').getByTestId('concept-load')).toHaveText('100');
  });
});
