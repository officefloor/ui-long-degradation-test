import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../../support/seed';

test.describe('total load', () => {
  test('total load sums computable loads only', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      people: [
        { id: 1, name: 'Dana', alpha: 3, beta: 4,  gamma: 10,   grade: 'HIGH' }, // load 165
        { id: 2, name: 'Ravi', alpha: 7, beta: 2,  gamma: 5,    grade: 'MID' },  // load 24
        { id: 3, name: 'Uma',  alpha: 5, beta: 20, gamma: 5,    grade: 'LOW' },  // load 100
        { id: 4, name: 'Gap',  alpha: 3, beta: 4,  gamma: null, grade: 'HIGH' }, // load n/a
      ],
    });
    await page.goto('/');

    await expect(page.getByTestId('person-row-4').getByTestId('concept-load')).toHaveText('n/a');
    await expect(page.getByTestId('rollup-total-load')).toHaveText('289'); // 165 + 24 + 100
  });
});
