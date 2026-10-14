import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../../support/seed';

//   combined = momentum: Dana 33, Ravi 8, Uma 100 ; quality 42, 5, 0 -> adjusted 75, 13, 100

test.describe('adjusted', () => {
  test('adjusted is combined plus quality', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
  people: [
    { id: 1, name: 'Dana', alpha: 3, beta: 4,  gamma: 10, active: true, score: 42 },
    { id: 2, name: 'Ravi', alpha: 7, beta: 2,  gamma: 5,  active: true, score: 5 },
    { id: 3, name: 'Uma',  alpha: 5, beta: 20, gamma: 5,  active: true, score: null },
  ],
});
    await page.goto('/');

    await expect(page.getByTestId('person-row-1').getByTestId('concept-adjusted')).toHaveText('75');
    await expect(page.getByTestId('person-row-2').getByTestId('concept-adjusted')).toHaveText('13');
    await expect(page.getByTestId('person-row-3').getByTestId('concept-adjusted')).toHaveText('100');
  });
});
