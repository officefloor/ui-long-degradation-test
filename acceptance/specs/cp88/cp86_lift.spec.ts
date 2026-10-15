import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

//   Ada 48*1=48, Ben 0, Dot 200*3=600, Max 150*3=450

test.describe('lift', () => {
  test('lift is blend times the drag multiplier', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
  people: [
    { id: 1, name: 'Ada', alpha: 2, beta: 3,  gamma: 5, delta: 3, epsilon: 4,  zeta: 10, active: true },
    { id: 2, name: 'Ben', alpha: 4, beta: 2,  gamma: 1, delta: 5, epsilon: 2,  zeta: 1,  active: true },
    { id: 3, name: 'Dot', alpha: 5, beta: 20, gamma: 5, delta: 5, epsilon: 20, zeta: 5,  active: true },
    { id: 4, name: 'Max', alpha: 5, beta: 10, gamma: 5, delta: 5, epsilon: 20, zeta: 5,  active: true },
  ],
});
    await page.goto('/');

    await expect(page.getByTestId('person-row-1').getByTestId('concept-lift')).toHaveText('48');
    await expect(page.getByTestId('person-row-2').getByTestId('concept-lift')).toHaveText('0');
    await expect(page.getByTestId('person-row-3').getByTestId('concept-lift')).toHaveText('600');
    await expect(page.getByTestId('person-row-4').getByTestId('concept-lift')).toHaveText('450');
  });
});
