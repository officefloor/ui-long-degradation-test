import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// grand influence = sum of every influence. With no patrons, influence = effective = momentum.
//   Ada 60, Ben 120, Cam 300, Dot 45 ; sum 525
//   Eli alpha missing -> momentum n/a -> influence n/a, skipped from the sum (still 525)

test.describe('grand influence', () => {
  test('sums every influence', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
  people: [
    { id: 1, name: 'Ada', alpha: 2,  beta: 30, gamma: 2,  active: true },
    { id: 2, name: 'Ben', alpha: 4,  beta: 30, gamma: 4,  active: true },
    { id: 3, name: 'Cam', alpha: 10, beta: 30, gamma: 10, active: true },
    { id: 4, name: 'Dot', alpha: 3,  beta: 15, gamma: 3,  active: true },
    { id: 5, name: 'Eli', alpha: null, beta: 30, gamma: 5, active: true }, // alpha missing -> influence n/a
  ],
});
    await page.goto('/');
    await expect(page.getByTestId('person-row-5').getByTestId('concept-influence')).toHaveText('n/a');
    await expect(page.getByTestId('rollup-grand-influence')).toHaveText('525'); // Eli's n/a influence is skipped
  });
});
