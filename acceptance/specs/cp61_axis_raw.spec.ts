import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// Act II opens a second raw axis: delta and epsilon (whole numbers) on each person.
test.describe('second axis raw values', () => {
  test('shows delta and epsilon', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      people: [
        { id: 1, name: 'Ada', alpha: 2, beta: 3, gamma: 5, delta: 3, epsilon: 4 },
        { id: 2, name: 'Ben', alpha: 4, beta: 2, gamma: 1, delta: 5, epsilon: 2 },
      ],
    });
    await page.goto('/');

    await expect(page.getByTestId('person-row-1').getByTestId('person-delta')).toHaveText('3');
    await expect(page.getByTestId('person-row-1').getByTestId('person-epsilon')).toHaveText('4');
    await expect(page.getByTestId('person-row-2').getByTestId('person-delta')).toHaveText('5');
    await expect(page.getByTestId('person-row-2').getByTestId('person-epsilon')).toHaveText('2');
  });
});
