import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// active is a boolean on each person, shown as 'yes' or 'no' at `person-active`. People start out
// active, so a person seeded without `active` shows 'yes'.
test.describe('active flag', () => {
  test('shows whether each person is active', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      people: [
        { id: 1, name: 'Dana', alpha: 3, beta: 4,  gamma: 10, active: true },
        { id: 2, name: 'Ravi', alpha: 7, beta: 2,  gamma: 5,  active: false },
        { id: 3, name: 'Uma',  alpha: 5, beta: 20, gamma: 5,  active: true },
        { id: 4, name: 'Kai',  alpha: 2, beta: 3,  gamma: 5 },              // no active given: people start out active
      ],
    });
    await page.goto('/');

    await expect(page.getByTestId('person-row-1').getByTestId('person-active')).toHaveText('yes');
    await expect(page.getByTestId('person-row-2').getByTestId('person-active')).toHaveText('no');
    await expect(page.getByTestId('person-row-3').getByTestId('person-active')).toHaveText('yes');
    await expect(page.getByTestId('person-row-4').getByTestId('person-active')).toHaveText('yes');
  });
});
