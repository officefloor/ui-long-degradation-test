import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';


test.describe('total gust', () => {
  test('total gust sums the gusts', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
  people: [
    { id: 1, name: 'Ada', alpha: 2, beta: 3,  gamma: 5, delta: 3, epsilon: 4,  zeta: 10, active: true },
    { id: 2, name: 'Ben', alpha: 4, beta: 2,  gamma: 1, delta: 5, epsilon: 2,  zeta: 1,  active: true },
    { id: 3, name: 'Dot', alpha: 5, beta: 20, gamma: 5, delta: 5, epsilon: 20, zeta: 5,  active: true },
    // Nil's delta is missing -> torque n/a -> gust n/a, so Nil is skipped (total stays 389).
    { id: 4, name: 'Nil', alpha: 1, beta: 1, gamma: 1, delta: null, epsilon: 1, zeta: 1, active: true },
  ],
  regions: [
    { personId: 1, region: 'N1' }, { personId: 2, region: 'S2' }, { personId: 3, region: 'E5' },
  ],
});
    await page.goto('/');

    await expect(page.getByTestId('person-row-4').getByTestId('concept-gust')).toHaveText('n/a');
    await expect(page.getByTestId('rollup-total-gust')).toHaveText('389');
  });
});
