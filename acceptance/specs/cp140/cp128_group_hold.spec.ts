import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// Group members are in REVIEW: a member still in DRAFT would be left out of the group's figures.

// A person on hold is left out of every figure for their groups, except a group's total: strength
// counts a held member at half of their value, rounded down. Size, spread and apex leave them out,
// and cohesion is the strength over the size that counts. A held person still shows their group.
//
// Everyone has no patrons and is active, so effective = momentum (gamma = alpha):
//   North: Ann 100, Bea 40, Hela 9*17 = 153 (on hold, counted at half: 76)
//     strength 100 + 40 + 76 = 216 (not 293), size 2 (not 3), cohesion 216/2 = 108,
//     spread 100 - 40 = 60 (not 113), apex Ann (not Hela)
//   South: Cal 60, Dot 40 -> strength 100, size 2, cohesion 50, spread 20, apex Cal
test.describe('hold in groups', () => {
  test('a held member counts at half in strength and is left out of the other group figures', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      anchor: '2026-03-01',
      // Ann's beta was 10 until 2026-02-01; Bea's change is dated after the anchor and does not count yet
      history: [
        { personId: 1, field: 'beta', value: 20, from: '2026-02-01' },
        { personId: 2, field: 'beta', value: 30, from: '2026-04-01' },
      ],
      groups: [{ id: 1, name: 'North' }, { id: 2, name: 'South' }],
      people: [
        { id: 1, name: 'Ann',  alpha: 5, beta: 10, gamma: 5, active: true, state: 'REVIEW' },
        { id: 2, name: 'Bea',  alpha: 4, beta: 10, gamma: 4, active: true, state: 'REVIEW' },
        { id: 3, name: 'Cal',  alpha: 6, beta: 10, gamma: 6, active: true, state: 'REVIEW' },
        { id: 4, name: 'Dot',  alpha: 5, beta: 8,  gamma: 5, active: true, state: 'REVIEW' },
        { id: 9, name: 'Hela', alpha: 9, beta: 17, gamma: 9, active: true, hold: true, state: 'REVIEW' },
      ],
      memberships: [{ personId: 1, groupId: 1 }, { personId: 2, groupId: 1 }, { personId: 3, groupId: 2 }, { personId: 4, groupId: 2 }, { personId: 9, groupId: 1 }],
    });
    await page.goto('/');

    await expect(page.getByTestId('person-row-9').getByTestId('person-group')).toHaveText('North');
    await expect(page.getByTestId('person-row-9').getByTestId('concept-effective')).toHaveText('153');
    await expect(page.getByTestId('group-row-1').getByTestId('group-concept-strength')).toHaveText('216');
    await expect(page.getByTestId('group-row-1').getByTestId('group-concept-size')).toHaveText('2');
    await expect(page.getByTestId('group-row-1').getByTestId('group-concept-cohesion')).toHaveText('108');
    await expect(page.getByTestId('group-row-1').getByTestId('group-concept-spread')).toHaveText('60');
    await expect(page.getByTestId('group-row-1').getByTestId('group-concept-apex')).toHaveText('Ann');
    await expect(page.getByTestId('group-row-2').getByTestId('group-concept-strength')).toHaveText('100');
    await expect(page.getByTestId('group-row-2').getByTestId('group-concept-cohesion')).toHaveText('50');

    // as of 2026-01-15, before Ann's beta change: her beta was 10, momentum 50
    //   North strength 50 + 40 + Hela 76 = 166
    await page.getByTestId('sheet-as-of').fill('2026-01-15');
    await page.getByTestId('sheet-as-of-apply').click();
    await expect(page.getByTestId('group-row-1').getByTestId('group-concept-strength')).toHaveText('166');
  });
});
