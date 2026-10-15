import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// Membership becomes MANY-TO-MANY: a person may belong to several groups (seeded as memberships[]).
// Dot also joins North, so North effective-strength = 100+120+40 = 260, size 3; Dot is in North
// and South, anchorage 2.

test.describe('many memberships', () => {
  test('a group reflects a shared member', { tag: '@functionality' }, async ({ page }) => {
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
      memberships: [{ personId: 1, groupId: 1 }, { personId: 2, groupId: 1 }, { personId: 3, groupId: 2 }, { personId: 4, groupId: 2 }, { personId: 5, groupId: 3 }, { personId: 6, groupId: 3 }, { personId: 4, groupId: 1 }],
    });
    await page.goto('/');

    await expect(page.getByTestId('group-row-1').getByTestId('group-concept-strength')).toHaveText('260');
    await expect(page.getByTestId('group-row-1').getByTestId('group-concept-size')).toHaveText('3');
  });

  test('a person can be in several groups', { tag: '@functionality' }, async ({ page }) => {
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
      memberships: [{ personId: 1, groupId: 1 }, { personId: 2, groupId: 1 }, { personId: 3, groupId: 2 }, { personId: 4, groupId: 2 }, { personId: 5, groupId: 3 }, { personId: 6, groupId: 3 }, { personId: 4, groupId: 1 }],
    });
    await page.goto('/');

    await expect(page.getByTestId('person-row-4').getByTestId('person-group')).toHaveText('North, South');
    await expect(page.getByTestId('person-row-4').getByTestId('concept-anchorage')).toHaveText('2');
  });
});
