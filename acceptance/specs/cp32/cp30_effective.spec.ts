import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../../support/seed';

// UPDATED PRIOR shipped by cp32 (mutates cp30). Inactive effective is now half of net rounded down.
const SEED = {
  people: [
    { id: 1, name: 'Dana', alpha: 3, beta: 4,  gamma: 10, active: true },  // net 33 -> 33
    { id: 2, name: 'Ravi', alpha: 7, beta: 2,  gamma: 5,  active: false }, // net 8  -> 4
    { id: 3, name: 'Uma',  alpha: 5, beta: 20, gamma: 5,  active: true },  // net 100 -> 100
    { id: 4, name: 'Odd',  alpha: 3, beta: 3,  gamma: 3,  active: false }, // net 9  -> 4
  ],
};

test.describe('effective', () => {
  test('effective is net when active, else half of net rounded down', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed(SEED);
    await page.goto('/');
    await page.getByTestId('nav-worksheet').click();

    await expect(page.getByTestId('person-row-1').getByTestId('concept-effective')).toHaveText('33');
    await expect(page.getByTestId('person-row-2').getByTestId('concept-effective')).toHaveText('4');
    await expect(page.getByTestId('person-row-3').getByTestId('concept-effective')).toHaveText('100');
    await expect(page.getByTestId('person-row-4').getByTestId('concept-effective')).toHaveText('4');
  });
});
