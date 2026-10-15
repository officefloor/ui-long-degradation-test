import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// cp143: group rank
test.describe('group rank', () => {
  test('ranks groups by strength', { tag: '@functionality' }, async ({ page }) => {
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

    await expect(page.getByTestId('group-row-1').getByTestId('group-concept-rank')).toHaveText('2');
    await expect(page.getByTestId('group-row-2').getByTestId('group-concept-rank')).toHaveText('3');
    await expect(page.getByTestId('group-row-3').getByTestId('group-concept-rank')).toHaveText('1');
  });

  // Tie-break: two groups with equal strength.
  // Each group has one active member with effective 60 (Cal alpha 5 * beta 12 = 60, Dot alpha 6 *
  // beta 10 = 60; gamma=alpha so drift 0, no patrons so net = momentum, active so effective =
  // net). Strength Beta = 60, Alpha = 60. Rank is highest strength first; the strength tie breaks
  // to the group name earlier in the alphabet => Alpha is rank 1, Beta is rank 2 (name wins over
  // the lower group id).
  test('group rank breaks ties by earlier name', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      groups: [{ id: 1, name: 'Beta' }, { id: 2, name: 'Alpha' }],
      people: [
        { id: 1, name: 'Cal', alpha: 5, beta: 12, gamma: 5, active: true },
        { id: 2, name: 'Dot', alpha: 6, beta: 10, gamma: 6, active: true },
      ],
      memberships: [{ personId: 1, groupId: 1 }, { personId: 2, groupId: 2 }],
    });
    await page.goto('/');

    await expect(page.getByTestId('group-row-1').getByTestId('group-concept-rank')).toHaveText('2');
    await expect(page.getByTestId('group-row-2').getByTestId('group-concept-rank')).toHaveText('1');
  });
});
