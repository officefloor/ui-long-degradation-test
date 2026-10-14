import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// coil = gust - momentum.
//   gust: Ada 63, Ben -5, Dot 200 ; momentum: Ada 15, Ben -1, Dot 100
//   coil: Ada 48, Ben -4, Dot 100

test.describe('coil', () => {
  test('coil is gust minus momentum', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
  people: [
    { id: 1, name: 'Ada', alpha: 2, beta: 3,  gamma: 5, delta: 3, epsilon: 4,  zeta: 10, active: true },
    { id: 2, name: 'Ben', alpha: 4, beta: 2,  gamma: 1, delta: 5, epsilon: 2,  zeta: 1,  active: true },
    { id: 3, name: 'Dot', alpha: 5, beta: 20, gamma: 5, delta: 5, epsilon: 20, zeta: 5,  active: true },
  ],
  regions: [
    { personId: 1, region: 'N1' }, { personId: 2, region: 'S2' }, { personId: 3, region: 'E5' },
  ],
});
    await page.goto('/');

    await expect(page.getByTestId('person-row-1').getByTestId('concept-coil')).toHaveText('48');
    await expect(page.getByTestId('person-row-2').getByTestId('concept-coil')).toHaveText('-4');
    await expect(page.getByTestId('person-row-3').getByTestId('concept-coil')).toHaveText('100');
  });
});
