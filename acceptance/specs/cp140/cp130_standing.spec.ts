import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

test.describe('standing', () => {
  test('standing ranks', { tag: '@functionality' }, async ({ page }) => {
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

    await expect(page.getByTestId('person-row-1').getByTestId('concept-standing')).toHaveText('2');
    await expect(page.getByTestId('person-row-2').getByTestId('concept-standing')).toHaveText('1');
    await expect(page.getByTestId('person-row-3').getByTestId('concept-standing')).toHaveText('1');
    await expect(page.getByTestId('person-row-4').getByTestId('concept-standing')).toHaveText('2');
    await expect(page.getByTestId('person-row-5').getByTestId('concept-standing')).toHaveText('1');
    await expect(page.getByTestId('person-row-6').getByTestId('concept-standing')).toHaveText('2');
  });

  // Tie-break: two members of one group with equal scaled but different alpha.
  // Ann: alpha 4 * beta 15 = 60; Bea: alpha 6 * beta 10 = 60 (gamma=alpha so drift 0); each
  // adjusted 60 in band D (0..99) => *1 => scaled 60. Standing is highest scaled first, and the
  // scaled tie breaks to the HIGHER alpha => Bea (alpha 6) is 1st, Ann (alpha 4) is 2nd, even
  // though Ann's name is earlier.
  test('standing breaks ties by higher alpha', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      groups: [{ id: 1, name: 'North' }],
      people: [
        { id: 1, name: 'Ann', alpha: 4, beta: 15, gamma: 4, active: true },
        { id: 2, name: 'Bea', alpha: 6, beta: 10, gamma: 6, active: true },
      ],
      memberships: [{ personId: 1, groupId: 1 }, { personId: 2, groupId: 1 }],
    });
    await page.goto('/');

    await expect(page.getByTestId('person-row-1').getByTestId('concept-standing')).toHaveText('2');
    await expect(page.getByTestId('person-row-2').getByTestId('concept-standing')).toHaveText('1');
  });
});
