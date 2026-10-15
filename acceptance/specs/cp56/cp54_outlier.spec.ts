import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

//   norms: -40, -20, 0, 160, 820 -> no, no, no, yes, yes

test.describe('outlier', () => {
  test('outlier when the norm magnitude exceeds 100', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
  people: [
    { id: 1, name: 'Fay', alpha: 5,  beta: 8,  gamma: 5,  active: true },
    { id: 2, name: 'Gus', alpha: 2,  beta: 30, gamma: 2,  active: true },
    { id: 3, name: 'Hal', alpha: 8,  beta: 10, gamma: 8,  active: true },
    { id: 4, name: 'Ivy', alpha: 4,  beta: 30, gamma: 4,  active: true },
    { id: 5, name: 'Jo',  alpha: 10, beta: 30, gamma: 10, active: true },
  ],
});
    await page.goto('/');

    await expect(page.getByTestId('person-row-1').getByTestId('concept-outlier')).toHaveText('no');
    await expect(page.getByTestId('person-row-2').getByTestId('concept-outlier')).toHaveText('no');
    await expect(page.getByTestId('person-row-3').getByTestId('concept-outlier')).toHaveText('no');
    await expect(page.getByTestId('person-row-4').getByTestId('concept-outlier')).toHaveText('yes');
    await expect(page.getByTestId('person-row-5').getByTestId('concept-outlier')).toHaveText('yes');
  });
});
