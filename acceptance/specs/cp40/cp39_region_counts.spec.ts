import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../../support/seed';


test.describe('region counts', () => {
  test('counts people per region, once per membership', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
  people: [
    { id: 1, name: 'Dana', alpha: 3, beta: 4,  gamma: 10 },
    { id: 2, name: 'Ravi', alpha: 7, beta: 2,  gamma: 5 },
    { id: 3, name: 'Uma',  alpha: 5, beta: 20, gamma: 5 },
  ],
  regions: [
    { personId: 1, region: 'N1' }, { personId: 1, region: 'S2' },
    { personId: 2, region: 'E5' },
    { personId: 3, region: 'N1' }, { personId: 3, region: 'E7' },
  ],
});
    await page.goto('/');

    await expect(page.getByTestId('region-count-N1')).toHaveText('2');
    await expect(page.getByTestId('region-count-S2')).toHaveText('1');
    await expect(page.getByTestId('region-count-E5')).toHaveText('1');
    await expect(page.getByTestId('region-count-E7')).toHaveText('1');
  });
});
