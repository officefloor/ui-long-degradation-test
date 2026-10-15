import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// grand total = grand scaled + grand influence = 1245 + 525 = 1770.
//   Eli alpha missing -> scaled & influence n/a, skipped from both sums (total still 1770)

test.describe('grand total', () => {
  test('grand total is grand scaled plus grand influence', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
  people: [
    { id: 1, name: 'Ada', alpha: 2,  beta: 30, gamma: 2,  active: true },
    { id: 2, name: 'Ben', alpha: 4,  beta: 30, gamma: 4,  active: true },
    { id: 3, name: 'Cam', alpha: 10, beta: 30, gamma: 10, active: true },
    { id: 4, name: 'Dot', alpha: 3,  beta: 15, gamma: 3,  active: true },
    { id: 5, name: 'Eli', alpha: null, beta: 30, gamma: 5, active: true }, // alpha missing -> scaled & influence n/a
  ],
});
    await page.goto('/');
    await expect(page.getByTestId('person-row-5').getByTestId('concept-scaled')).toHaveText('n/a');
    await expect(page.getByTestId('rollup-grand-total')).toHaveText('1770'); // Eli skipped from both grand sums
  });
});
