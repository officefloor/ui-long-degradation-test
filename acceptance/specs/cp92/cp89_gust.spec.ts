import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../../support/seed';

// UPDATED PRIOR shipped by cp92 (mutates cp89). gust = reach + 2*torque.
const SEED = {
  people: [
    { id: 1, name: 'Ada', alpha: 2, beta: 3,  gamma: 5, delta: 3, epsilon: 4,  zeta: 10, active: true },
    { id: 2, name: 'Ben', alpha: 4, beta: 2,  gamma: 1, delta: 5, epsilon: 2,  zeta: 1,  active: true },
    { id: 3, name: 'Dot', alpha: 5, beta: 20, gamma: 5, delta: 5, epsilon: 20, zeta: 5,  active: true },
  ],
  regions: [
    { personId: 1, region: 'N1' }, { personId: 2, region: 'S2' }, { personId: 3, region: 'E5' },
  ],
};

test.describe('gust', () => {
  test('gust is reach plus 2*torque', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed(SEED);
    await page.goto('/');
    await page.getByTestId('nav-worksheet').click();

    await expect(page.getByTestId('person-row-1').getByTestId('concept-gust')).toHaveText('96');
    await expect(page.getByTestId('person-row-2').getByTestId('concept-gust')).toHaveText('-7');
    await expect(page.getByTestId('person-row-3').getByTestId('concept-gust')).toHaveText('300');
  });
});
