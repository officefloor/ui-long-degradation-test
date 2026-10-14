import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// regions are now a join list `regions: [{ personId, region }]` (the per-person region field is gone).
// person-region lists all regions sorted ascending. reach = sum over the person's regions of
// momentum*multiplier. Counts count a person once per region they belong to.

test.describe('many regions', () => {
  test('a person has several regions and reach sums over them', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
  people: [
    { id: 1, name: 'Dana', alpha: 3, beta: 4,  gamma: 10 }, // momentum 33
    { id: 2, name: 'Ravi', alpha: 7, beta: 2,  gamma: 5 },  // momentum 8
    { id: 3, name: 'Uma',  alpha: 5, beta: 20, gamma: 5 },  // momentum 100
  ],
  regions: [
    { personId: 1, region: 'N1' }, { personId: 1, region: 'S2' }, // Dana reach 33*2 + 33*3 = 165
    { personId: 2, region: 'E5' },                                // Ravi reach 8*1 = 8
    { personId: 3, region: 'N1' }, { personId: 3, region: 'E7' }, // Uma  reach 100*2 + 100*1 = 300
  ],
});
    await page.goto('/');

    await expect(page.getByTestId('person-row-1').getByTestId('person-region')).toHaveText('N1, S2');
    await expect(page.getByTestId('person-row-2').getByTestId('person-region')).toHaveText('E5');
    await expect(page.getByTestId('person-row-3').getByTestId('person-region')).toHaveText('E7, N1');

    await expect(page.getByTestId('person-row-1').getByTestId('concept-reach')).toHaveText('165');
    await expect(page.getByTestId('person-row-2').getByTestId('concept-reach')).toHaveText('8');
    await expect(page.getByTestId('person-row-3').getByTestId('concept-reach')).toHaveText('300');
  });

  test('counts count a person once per region', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
  people: [
    { id: 1, name: 'Dana', alpha: 3, beta: 4,  gamma: 10 }, // momentum 33
    { id: 2, name: 'Ravi', alpha: 7, beta: 2,  gamma: 5 },  // momentum 8
    { id: 3, name: 'Uma',  alpha: 5, beta: 20, gamma: 5 },  // momentum 100
  ],
  regions: [
    { personId: 1, region: 'N1' }, { personId: 1, region: 'S2' }, // Dana reach 33*2 + 33*3 = 165
    { personId: 2, region: 'E5' },                                // Ravi reach 8*1 = 8
    { personId: 3, region: 'N1' }, { personId: 3, region: 'E7' }, // Uma  reach 100*2 + 100*1 = 300
  ],
});
    await page.goto('/');

    await expect(page.getByTestId('region-count-N1')).toHaveText('2'); // Dana, Uma
    await expect(page.getByTestId('region-count-S2')).toHaveText('1'); // Dana
    await expect(page.getByTestId('region-count-E5')).toHaveText('1'); // Ravi
    await expect(page.getByTestId('region-count-E7')).toHaveText('1'); // Uma
  });
});
