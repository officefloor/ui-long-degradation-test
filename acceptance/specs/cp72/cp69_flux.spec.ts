import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// flux = average of the patrons' force, rounded down (0 if no patrons).
//   force: Ada 3*4=12, Ben 5*2=10, Dot 5*20=100
//   Ada patrons Ben, Dot -> (10+100)/2 = 55; Ben none -> 0; Dot patron Ben -> 10/1 = 10

test.describe('flux', () => {
  test('flux averages the patrons force', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
  people: [
    { id: 1, name: 'Ada', alpha: 2, beta: 3,  gamma: 5, delta: 3, epsilon: 4,  zeta: 10 },
    { id: 2, name: 'Ben', alpha: 4, beta: 2,  gamma: 1, delta: 5, epsilon: 2,  zeta: 1 },
    { id: 3, name: 'Dot', alpha: 5, beta: 20, gamma: 5, delta: 5, epsilon: 20, zeta: 5 },
  ],
  patrons: [
    { personId: 1, patronId: 2 }, { personId: 1, patronId: 3 },
    { personId: 3, patronId: 2 },
  ],
});
    await page.goto('/');

    await expect(page.getByTestId('person-row-1').getByTestId('concept-flux')).toHaveText('55');
    await expect(page.getByTestId('person-row-2').getByTestId('concept-flux')).toHaveText('0');
    await expect(page.getByTestId('person-row-3').getByTestId('concept-flux')).toHaveText('10');
  });
});
