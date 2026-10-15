import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

test.describe('share rounded nearest', () => {
  test('share nearest', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      groups: [{ id: 1, name: 'North' }, { id: 2, name: 'South' }, { id: 3, name: 'East' }],
      people: [
        { id: 1, name: 'Ann', alpha: 5, beta: 20, gamma: 5, active: true },
        { id: 2, name: 'Bea', alpha: 4, beta: 30, gamma: 4, active: true },
        { id: 3, name: 'Cal', alpha: 6, beta: 10, gamma: 6, active: true },
        { id: 4, name: 'Dot', alpha: 5, beta: 8, gamma: 5, active: true },
        { id: 5, name: 'Eli', alpha: 10, beta: 30, gamma: 10, active: true },
        { id: 6, name: 'Fia', alpha: 5, beta: 6, gamma: 5, active: true },
      ],
      memberships: [{ personId: 1, groupId: 1 }, { personId: 2, groupId: 1 }, { personId: 3, groupId: 2 }, { personId: 4, groupId: 2 }, { personId: 5, groupId: 3 }, { personId: 6, groupId: 3 }],
    });
    await page.goto('/');

    await expect(page.getByTestId('person-row-1').getByTestId('concept-share')).toHaveText('91');
    await expect(page.getByTestId('person-row-2').getByTestId('concept-share')).toHaveText('109');
    await expect(page.getByTestId('person-row-3').getByTestId('concept-share')).toHaveText('60');
    await expect(page.getByTestId('person-row-4').getByTestId('concept-share')).toHaveText('40');
    await expect(page.getByTestId('person-row-5').getByTestId('concept-share')).toHaveText('273');
    await expect(page.getByTestId('person-row-6').getByTestId('concept-share')).toHaveText('9');
  });
});
