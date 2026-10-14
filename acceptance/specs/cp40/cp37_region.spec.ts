import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../../support/seed';

// UPDATED PRIOR shipped by cp40 (mutates cp37). region is many; person-region lists all regions sorted.
const SEED = {
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
};

test.describe('region', () => {
  test('shows each person their regions', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed(SEED);
    await page.goto('/');
    await page.getByTestId('nav-worksheet').click();

    await expect(page.getByTestId('person-row-1').getByTestId('person-region')).toHaveText('N1, S2');
    await expect(page.getByTestId('person-row-2').getByTestId('person-region')).toHaveText('E5');
    await expect(page.getByTestId('person-row-3').getByTestId('person-region')).toHaveText('E7, N1');
  });
});
