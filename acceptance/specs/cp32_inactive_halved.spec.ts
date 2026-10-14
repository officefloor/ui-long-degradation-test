import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// (was 0). Active people are unchanged. total effective follows; active count is unchanged.

test.describe('inactive halved', () => {
  test('inactive effective is half of net rounded down', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
  people: [
    { id: 1, name: 'Dana', alpha: 3, beta: 4,  gamma: 10, active: true },  // net 33, active -> 33
    { id: 2, name: 'Ravi', alpha: 7, beta: 2,  gamma: 5,  active: false }, // net 8  -> floor(8/2)=4
    { id: 3, name: 'Uma',  alpha: 5, beta: 20, gamma: 5,  active: true },  // net 100 -> 100
    { id: 4, name: 'Odd',  alpha: 3, beta: 3,  gamma: 3,  active: false }, // net 9  -> floor(9/2)=4
  ],
});
    await page.goto('/');

    await expect(page.getByTestId('person-row-1').getByTestId('concept-effective')).toHaveText('33');
    await expect(page.getByTestId('person-row-2').getByTestId('concept-effective')).toHaveText('4');
    await expect(page.getByTestId('person-row-3').getByTestId('concept-effective')).toHaveText('100');
    await expect(page.getByTestId('person-row-4').getByTestId('concept-effective')).toHaveText('4');

    await expect(page.getByTestId('rollup-active-count')).toHaveText('2');
    await expect(page.getByTestId('rollup-total-effective')).toHaveText('141'); // 33 + 4 + 100 + 4
  });
});
