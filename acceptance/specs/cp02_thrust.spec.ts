import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// First concept on raw values: thrust = alpha * beta. Person is now { id, name, alpha, beta }.
test.describe('thrust', () => {
  test('thrust is alpha times beta', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      people: [
        { id: 1, name: 'Dana', alpha: 3, beta: 4 },  // thrust 12
        { id: 2, name: 'Ravi', alpha: 7, beta: 2 },  // thrust 14
      ],
    });
    await page.goto('/');

    await expect(page.getByTestId('person-row-1').getByTestId('person-beta')).toHaveText('4');
    await expect(page.getByTestId('person-row-1').getByTestId('concept-thrust')).toHaveText('12');
    await expect(page.getByTestId('person-row-2').getByTestId('concept-thrust')).toHaveText('14');
  });

  test('thrust can be zero and negative', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      people: [
        { id: 1, name: 'Amy', alpha: 0, beta: 9 },    // thrust 0
        { id: 2, name: 'Bo', alpha: -4, beta: 5 },     // thrust -20
      ],
    });
    await page.goto('/');

    await expect(page.getByTestId('person-row-1').getByTestId('concept-thrust')).toHaveText('0');
    await expect(page.getByTestId('person-row-2').getByTestId('concept-thrust')).toHaveText('-20');
  });
});
