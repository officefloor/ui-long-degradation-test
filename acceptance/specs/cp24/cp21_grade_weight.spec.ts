import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../../support/seed';

// UPDATED PRIOR shipped by cp24 (mutates cp21). weight remapped: LOW=1, MID=3, HIGH=5.
test.describe('grade weight', () => {
  test('weight comes from grade', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      people: [
        { id: 1, name: 'Dana', alpha: 3, beta: 4,  gamma: 10, grade: 'HIGH' },
        { id: 2, name: 'Ravi', alpha: 7, beta: 2,  gamma: 5,  grade: 'MID' },
        { id: 3, name: 'Uma',  alpha: 5, beta: 20, gamma: 5,  grade: 'LOW' },
      ],
    });
    await page.goto('/');
    await page.getByTestId('nav-worksheet').click();

    await expect(page.getByTestId('person-row-1').getByTestId('concept-weight')).toHaveText('5');
    await expect(page.getByTestId('person-row-2').getByTestId('concept-weight')).toHaveText('3');
    await expect(page.getByTestId('person-row-3').getByTestId('concept-weight')).toHaveText('1');
  });
});
