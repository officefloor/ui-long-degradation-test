import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// Region counts rollup: how many people are in each region. The count for a region is shown at
// `region-count-<REGION>`.
test.describe('region counts', () => {
  test('counts people per region', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      people: [
        { id: 1, name: 'Dana', alpha: 3, beta: 4,  gamma: 10, region: 'N1' },
        { id: 2, name: 'Ravi', alpha: 7, beta: 2,  gamma: 5,  region: 'S2' },
        { id: 3, name: 'Uma',  alpha: 5, beta: 20, gamma: 5,  region: 'N1' },
        { id: 4, name: 'Vic',  alpha: 4, beta: 5,  gamma: 4,  region: 'S2' },
        { id: 5, name: 'Wes',  alpha: 2, beta: 10, gamma: 2,  region: 'E5' },
      ],
    });
    await page.goto('/');

    await expect(page.getByTestId('region-count-N1')).toHaveText('2');
    await expect(page.getByTestId('region-count-S2')).toHaveText('2');
    await expect(page.getByTestId('region-count-E5')).toHaveText('1');
  });
});
