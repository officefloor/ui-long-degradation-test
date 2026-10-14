import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// sheet standing = position ordered by scaled desc (ties by name asc).
//   Cam 900 -> 1, Ben 240 -> 2, Ada 60 -> 3, Dot 45 -> 4
const SEED = {
  people: [
    { id: 1, name: 'Ada', alpha: 2,  beta: 30, gamma: 2,  active: true },
    { id: 2, name: 'Ben', alpha: 4,  beta: 30, gamma: 4,  active: true },
    { id: 3, name: 'Cam', alpha: 10, beta: 30, gamma: 10, active: true },
    { id: 4, name: 'Dot', alpha: 3,  beta: 15, gamma: 3,  active: true },
  ],
};

test.describe('sheet standing', () => {
  test('standing orders by scaled desc', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed(SEED);
    await page.goto('/');
    await page.getByTestId('nav-worksheet').click();

    await expect(page.getByTestId('person-row-3').getByTestId('concept-standing-v')).toHaveText('1');
    await expect(page.getByTestId('person-row-2').getByTestId('concept-standing-v')).toHaveText('2');
    await expect(page.getByTestId('person-row-1').getByTestId('concept-standing-v')).toHaveText('3');
    await expect(page.getByTestId('person-row-4').getByTestId('concept-standing-v')).toHaveText('4');
  });
});
