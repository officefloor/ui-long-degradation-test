import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// Cross-entity concept: backing = the patron's thrust. No patron -> backing is 'n/a'.
test.describe('backing', () => {
  test('backing is the patron thrust, n/a without a patron', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      people: [
        { id: 1, name: 'Dana', alpha: 3, beta: 4,  gamma: 10, patronId: 2 }, // patron Ravi, thrust 14
        { id: 2, name: 'Ravi', alpha: 7, beta: 2,  gamma: 5,  patronId: null },
        { id: 3, name: 'Uma',  alpha: 5, beta: 20, gamma: 5,  patronId: 2 }, // patron Ravi, thrust 14
      ],
    });
    await page.goto('/');

    await expect(page.getByTestId('person-row-1').getByTestId('concept-backing')).toHaveText('14');
    await expect(page.getByTestId('person-row-3').getByTestId('concept-backing')).toHaveText('14');
    await expect(page.getByTestId('person-row-2').getByTestId('concept-backing')).toHaveText('n/a');
  });
});
