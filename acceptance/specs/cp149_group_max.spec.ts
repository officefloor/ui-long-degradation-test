import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// Group members are in REVIEW: a member still in DRAFT would be left out of the group's figures.

// group max: the highest of the members' values, a group figure worked out from members' values
// using their effective. Everyone active, no patrons: effective = momentum.
//   North Ann 100, Bea 120 -> 120 ; South Cal 60, Dot 40 -> 60 ; East Eli 300, Fia 30 -> 300
test.describe('group max', () => {
  test('the highest member value', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      anchor: '2026-03-01',
      // Bea's beta was 20 until 2026-02-01; Fia's change is dated after the anchor and does not count yet
      history: [
        { personId: 2, field: 'beta', value: 30, from: '2026-02-01' },
        { personId: 6, field: 'beta', value: 70, from: '2026-04-01' },
      ],
      groups: [{ id: 1, name: 'North' }, { id: 2, name: 'South' }, { id: 3, name: 'East' }],
      people: [
        { id: 1, name: 'Ann', alpha: 5, beta: 20, gamma: 5, active: true, state: 'REVIEW' },
        { id: 2, name: 'Bea', alpha: 4, beta: 20, gamma: 4, active: true, state: 'REVIEW' },
        { id: 3, name: 'Cal', alpha: 6, beta: 10, gamma: 6, active: true, state: 'REVIEW' },
        { id: 4, name: 'Dot', alpha: 5, beta: 8, gamma: 5, active: true, state: 'REVIEW' },
        { id: 5, name: 'Eli', alpha: 10, beta: 30, gamma: 10, active: true, state: 'REVIEW' },
        { id: 6, name: 'Fia', alpha: 5, beta: 6, gamma: 5, active: true, state: 'REVIEW' },
      ],
      memberships: [{ personId: 1, groupId: 1 }, { personId: 2, groupId: 1 }, { personId: 3, groupId: 2 }, { personId: 4, groupId: 2 }, { personId: 5, groupId: 3 }, { personId: 6, groupId: 3 }],
    });
    await page.goto('/');

    await expect(page.getByTestId('group-row-1').getByTestId('group-concept-max')).toHaveText('120');
    await expect(page.getByTestId('group-row-2').getByTestId('group-concept-max')).toHaveText('60');
    await expect(page.getByTestId('group-row-3').getByTestId('group-concept-max')).toHaveText('300');

    // as of 2026-01-15, before Bea's beta change: her beta was 20, momentum 80
    //   North max(Ann 100, Bea 80) = 100
    await page.getByTestId('sheet-as-of').fill('2026-01-15');
    await page.getByTestId('sheet-as-of-apply').click();
    await expect(page.getByTestId('group-row-1').getByTestId('group-concept-max')).toHaveText('100');
  });
});
