import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// still 'n/a' when the person has no patrons.
test.describe('backing', () => {
  test('backing is the patron thrust, n/a without a patron', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      people: [
        { id: 1, name: 'Dana', alpha: 3, beta: 4,  gamma: 10 }, // thrust 12
        { id: 2, name: 'Ravi', alpha: 7, beta: 2,  gamma: 5 },  // thrust 14
        { id: 3, name: 'Uma',  alpha: 5, beta: 20, gamma: 5 },  // thrust 100
      ],
      patrons: [
        { personId: 1, patronId: 2 }, { personId: 1, patronId: 3 }, // Dana <- Ravi(14), Uma(100) = 114
        { personId: 3, patronId: 2 },                               // Uma  <- Ravi(14) = 14
      ],
    });
    await page.goto('/');

    await expect(page.getByTestId('person-row-1').getByTestId('concept-backing')).toHaveText('114');
    await expect(page.getByTestId('person-row-3').getByTestId('concept-backing')).toHaveText('14');
    await expect(page.getByTestId('person-row-2').getByTestId('concept-backing')).toHaveText('n/a');
  });
});
