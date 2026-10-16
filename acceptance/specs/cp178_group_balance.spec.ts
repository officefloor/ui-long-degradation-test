import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// balance = strength - cohesion*size, where cohesion is strength / size rounded to the nearest whole
// number (a half rounding up). It is what the strength carries over an even whole-number share for
// every member, negative when the rounding went up. Every member is FINAL (a DRAFT member would be left
// out of the group's figures). The groups vary in size (3, 2, 1).
test.describe('balance', () => {
  test('strength minus cohesion times size', { tag: '@functionality' }, async ({ page }) => {
    // a change dated after the anchor does not count yet (Ann's beta 40 from 2026-04-01); Dot's beta
    // was 4 until it became 9 on 2026-02-01
    await resetAndSeed({
      anchor: '2026-03-01',
      history: [
        { personId: 1, field: 'beta', value: 40, from: '2026-04-01' },
        { personId: 4, field: 'beta', value: 9, from: '2026-02-01' },
      ],
      groups: [{ id: 1, name: 'North' }, { id: 2, name: 'South' }, { id: 3, name: 'East' }],
      people: [
        // North (size 3): effective 100 + 120 + 60 = 280; cohesion 280/3 = 93.3 -> 93; balance 280 - 93*3 = 1
        { id: 1, name: 'Ann', alpha: 5, beta: 20, gamma: 5, active: true, state: 'FINAL' }, // 100
        { id: 2, name: 'Bea', alpha: 4, beta: 30, gamma: 4, active: true, state: 'FINAL' }, // 120
        { id: 3, name: 'Cal', alpha: 1, beta: 60, gamma: 1, active: true, state: 'FINAL' }, // 60
        // South (size 2): effective 45 + 40 = 85; cohesion 85/2 = 42.5 -> 43; balance 85 - 43*2 = -1
        { id: 4, name: 'Dot', alpha: 5, beta: 4, gamma: 5, active: true, state: 'FINAL' },  // 45 (beta 9 from 2026-02-01)
        { id: 5, name: 'Eli', alpha: 4, beta: 10, gamma: 4, active: true, state: 'FINAL' }, // 40
        // East (size 1): effective 30; cohesion 30; balance 30-30*1 = 0
        { id: 6, name: 'Fia', alpha: 5, beta: 6, gamma: 5, active: true, state: 'FINAL' },  // 30
      ],
      memberships: [{ personId: 1, groupId: 1 }, { personId: 2, groupId: 1 }, { personId: 3, groupId: 1 }, { personId: 4, groupId: 2 }, { personId: 5, groupId: 2 }, { personId: 6, groupId: 3 }],
    });
    await page.goto('/');

    await expect(page.getByTestId('group-row-1').getByTestId('group-concept-balance')).toHaveText('1');
    await expect(page.getByTestId('group-row-2').getByTestId('group-concept-balance')).toHaveText('-1');
    await expect(page.getByTestId('group-row-3').getByTestId('group-concept-balance')).toHaveText('0');

    // as of 2026-01-15 Dot's beta is still 4: effective 20, South 20 + 40 = 60, cohesion 30, balance 0
    await page.getByTestId('sheet-as-of').fill('2026-01-15');
    await page.getByTestId('sheet-as-of-apply').click();
    await expect(page.getByTestId('group-row-2').getByTestId('group-concept-balance')).toHaveText('0');
  });
});
