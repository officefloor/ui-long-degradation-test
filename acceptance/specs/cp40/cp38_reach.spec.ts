import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../../support/seed';

// person's regions.

test.describe('reach', () => {
  test('reach sums over the regions', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
  people: [
    { id: 1, name: 'Dana', alpha: 3, beta: 4,  gamma: 10 }, // momentum 33
    { id: 2, name: 'Ravi', alpha: 7, beta: 2,  gamma: 5 },  // momentum 8
    { id: 3, name: 'Uma',  alpha: 5, beta: 20, gamma: 5 },  // momentum 100
  ],
  regions: [
    { personId: 1, region: 'N1' }, { personId: 1, region: 'S2' }, // 33*2 + 33*3 = 165
    { personId: 2, region: 'E5' },                                // 8*1 = 8
    { personId: 3, region: 'N1' }, { personId: 3, region: 'E7' }, // 100*2 + 100*1 = 300
  ],
});
    await page.goto('/');

    await expect(page.getByTestId('person-row-1').getByTestId('concept-reach')).toHaveText('165');
    await expect(page.getByTestId('person-row-2').getByTestId('concept-reach')).toHaveText('8');
    await expect(page.getByTestId('person-row-3').getByTestId('concept-reach')).toHaveText('300');
  });
});
