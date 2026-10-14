import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// region multiplier from the first letter: N->2, S->3, anything else->1.
// reach = momentum * region multiplier.
test.describe('reach', () => {
  test('reach is momentum times the region multiplier', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      people: [
        { id: 1, name: 'Dana', alpha: 3, beta: 4,  gamma: 10, region: 'N1' }, // momentum 33, x2 -> 66
        { id: 2, name: 'Ravi', alpha: 7, beta: 2,  gamma: 5,  region: 'S2' }, // momentum 8,  x3 -> 24
        { id: 3, name: 'Uma',  alpha: 5, beta: 20, gamma: 5,  region: 'E5' }, // momentum 100, x1 -> 100
      ],
    });
    await page.goto('/');
    await page.getByTestId('nav-worksheet').click();

    await expect(page.getByTestId('person-row-1').getByTestId('concept-reach')).toHaveText('66');
    await expect(page.getByTestId('person-row-2').getByTestId('concept-reach')).toHaveText('24');
    await expect(page.getByTestId('person-row-3').getByTestId('concept-reach')).toHaveText('100');
  });
});
