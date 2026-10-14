import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// force = delta * epsilon.
test.describe('force', () => {
  test('force is delta times epsilon', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      people: [
        { id: 1, name: 'Ada', alpha: 2, beta: 3, gamma: 5, delta: 3,  epsilon: 4 }, // 12
        { id: 2, name: 'Ben', alpha: 4, beta: 2, gamma: 1, delta: 5,  epsilon: 2 }, // 10
        { id: 3, name: 'Cyr', alpha: 1, beta: 1, gamma: 1, delta: -2, epsilon: 5 }, // -10
      ],
    });
    await page.goto('/');
    await page.getByTestId('nav-worksheet').click();

    await expect(page.getByTestId('person-row-1').getByTestId('concept-force')).toHaveText('12');
    await expect(page.getByTestId('person-row-2').getByTestId('concept-force')).toHaveText('10');
    await expect(page.getByTestId('person-row-3').getByTestId('concept-force')).toHaveText('-10');
  });
});
