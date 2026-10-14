import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// Concepts upon concepts. drift = gamma - alpha. momentum = thrust + 2*drift (thrust itself is a
// concept, so momentum is a concept built on a concept). Person is { id, name, alpha, beta, gamma }.
test.describe('drift and momentum', () => {
  test('drift and momentum build on thrust', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      people: [
        // thrust 12, drift 10-3=7,  momentum 12 + 2*7  = 26
        { id: 1, name: 'Dana', alpha: 3, beta: 4, gamma: 10 },
        // thrust 14, drift 5-7=-2, momentum 14 + 2*-2 = 10
        { id: 2, name: 'Ravi', alpha: 7, beta: 2, gamma: 5 },
      ],
    });
    await page.goto('/');

    await expect(page.getByTestId('person-row-1').getByTestId('concept-drift')).toHaveText('7');
    await expect(page.getByTestId('person-row-1').getByTestId('concept-momentum')).toHaveText('26');
    await expect(page.getByTestId('person-row-2').getByTestId('concept-drift')).toHaveText('-2');
    await expect(page.getByTestId('person-row-2').getByTestId('concept-momentum')).toHaveText('10');
  });
});
