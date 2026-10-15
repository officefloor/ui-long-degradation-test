import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// <-10 NEG.

test.describe('pulse', () => {
  test('pulse classifies strain with a tolerance band', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
  people: [
    { id: 1, name: 'Ada', alpha: 2, beta: 3,  gamma: 5, delta: 3, epsilon: 4,  zeta: 10, active: true },
    { id: 2, name: 'Ben', alpha: 4, beta: 2,  gamma: 1, delta: 5, epsilon: 2,  zeta: 1,  active: true },
    { id: 3, name: 'Dot', alpha: 5, beta: 20, gamma: 5, delta: 5, epsilon: 20, zeta: 5,  active: true },
    { id: 4, name: 'Eve', alpha: 2, beta: 3,  gamma: 5, delta: 2, epsilon: 3,  zeta: 4,  active: true },
  ],
});
    await page.goto('/');

    await expect(page.getByTestId('person-row-1').getByTestId('concept-pulse')).toHaveText('FLAT');
    await expect(page.getByTestId('person-row-2').getByTestId('concept-pulse')).toHaveText('NEG');
    await expect(page.getByTestId('person-row-3').getByTestId('concept-pulse')).toHaveText('NEG');
    await expect(page.getByTestId('person-row-4').getByTestId('concept-pulse')).toHaveText('FLAT');
  });
});
