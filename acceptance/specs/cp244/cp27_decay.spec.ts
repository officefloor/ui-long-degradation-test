import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../../support/seed';

// UPDATED PRIOR shipped by cp244 (mutates cp27). decay = momentum - age, with age back in days.
test.describe('decay', () => {
  test('decay is momentum minus age', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      anchor: '2020-01-31',
      people: [
        { id: 1, name: 'Dana', alpha: 3, beta: 4,  gamma: 10, onset: '2020-01-01' }, // momentum 33, age 30  -> 3
        { id: 2, name: 'Ravi', alpha: 7, beta: 2,  gamma: 5,  onset: '2020-01-24' }, // momentum 8,  age 7   -> 1
        { id: 3, name: 'Uma',  alpha: 5, beta: 20, gamma: 5,  onset: '2020-02-10' }, // momentum 100, age -10 -> 110
        { id: 4, name: 'Zoe',  alpha: 2, beta: 10, gamma: 2,  onset: '2020-01-17' }, // momentum 20, age 14  -> 6
      ],
    });
    await page.goto('/');
    await page.getByTestId('nav-worksheet').click();

    await expect(page.getByTestId('person-row-1').getByTestId('concept-decay')).toHaveText('3');
    await expect(page.getByTestId('person-row-2').getByTestId('concept-decay')).toHaveText('1');
    await expect(page.getByTestId('person-row-3').getByTestId('concept-decay')).toHaveText('110');
    await expect(page.getByTestId('person-row-4').getByTestId('concept-decay')).toHaveText('6');
  });
});
