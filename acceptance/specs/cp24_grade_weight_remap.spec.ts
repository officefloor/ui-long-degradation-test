import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// MUTATIVE (mutates cp21, cp22, cp23): weight remapped to LOW=1, MID=3, HIGH=5. That changes load
// (momentum*weight) and total load. Updated cp21/cp22/cp23 ship under acceptance/specs/cp24/.
test.describe('grade weight remapped', () => {
  test('wider weights change load and total load', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      people: [
        { id: 1, name: 'Dana', alpha: 3, beta: 4,  gamma: 10,   grade: 'HIGH' }, // weight 5, load 33*5=165
        { id: 2, name: 'Ravi', alpha: 7, beta: 2,  gamma: 5,    grade: 'MID' },  // weight 3, load 8*3=24
        { id: 3, name: 'Uma',  alpha: 5, beta: 20, gamma: 5,    grade: 'LOW' },  // weight 1, load 100
        { id: 4, name: 'Gap',  alpha: 3, beta: 4,  gamma: null, grade: 'HIGH' }, // load n/a
      ],
    });
    await page.goto('/');
    await page.getByTestId('nav-worksheet').click();

    await expect(page.getByTestId('person-row-1').getByTestId('concept-weight')).toHaveText('5');
    await expect(page.getByTestId('person-row-2').getByTestId('concept-weight')).toHaveText('3');
    await expect(page.getByTestId('person-row-3').getByTestId('concept-weight')).toHaveText('1');

    await expect(page.getByTestId('person-row-1').getByTestId('concept-load')).toHaveText('165');
    await expect(page.getByTestId('person-row-2').getByTestId('concept-load')).toHaveText('24');
    await expect(page.getByTestId('person-row-3').getByTestId('concept-load')).toHaveText('100');

    await expect(page.getByTestId('rollup-total-load')).toHaveText('289'); // 165 + 24 + 100
  });
});
