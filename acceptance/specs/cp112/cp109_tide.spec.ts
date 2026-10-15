import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';


test.describe('tide', () => {
  test('tide sums only positive followed brace', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
  people: [
    { id: 1, name: 'Ada', alpha: 2, beta: 3,  gamma: 5, delta: 3,  epsilon: 4,   zeta: 10, active: true },
    { id: 2, name: 'Ben', alpha: 4, beta: 2,  gamma: 1, delta: 5,  epsilon: 2,   zeta: 1,  active: true },
    { id: 3, name: 'Dot', alpha: 5, beta: 20, gamma: 5, delta: 5,  epsilon: 20,  zeta: 5,  active: true },
    { id: 4, name: 'Gus', alpha: 1, beta: 1,  gamma: 1, delta: 1,  epsilon: -30, zeta: 1,  active: true },
  ],
  follows: [
    { from: 1, to: 2 }, { from: 1, to: 3 }, { from: 1, to: 4 },
    { from: 3, to: 2 },
  ],
});
    await page.goto('/');

    await expect(page.getByTestId('person-row-1').getByTestId('concept-tide')).toHaveText('319');
    await expect(page.getByTestId('person-row-2').getByTestId('concept-tide')).toHaveText('0');
    await expect(page.getByTestId('person-row-3').getByTestId('concept-tide')).toHaveText('19');
    await expect(page.getByTestId('person-row-4').getByTestId('concept-tide')).toHaveText('0');
  });
});
