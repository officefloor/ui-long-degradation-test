import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../../support/seed';


test.describe('thrum', () => {
  test('thrum is scaled plus 2*torque', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
  people: [
    { id: 1, name: 'Ada', alpha: 2, beta: 3,  gamma: 5, delta: 3, epsilon: 4,  zeta: 10, active: true },
    { id: 2, name: 'Ben', alpha: 4, beta: 2,  gamma: 1, delta: 5, epsilon: 2,  zeta: 1,  active: true },
    { id: 3, name: 'Dot', alpha: 5, beta: 20, gamma: 5, delta: 5, epsilon: 20, zeta: 5,  active: true },
  ],
});
    await page.goto('/');

    await expect(page.getByTestId('person-row-1').getByTestId('concept-thrum')).toHaveText('81');
    await expect(page.getByTestId('person-row-2').getByTestId('concept-thrum')).toHaveText('-4');
    await expect(page.getByTestId('person-row-3').getByTestId('concept-thrum')).toHaveText('400');
  });
});
