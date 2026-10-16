import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// Group members are in REVIEW: a member still in DRAFT would be left out of the group's figures.

// Every figure for a group that is worked out from its members' values uses their effective values,
// never their scaled values: strength is the total of the members' effective.
//
// effective = net when active, half of net (rounded down) when not; scaled = adjusted * band
// multiplier, adjusted = influence + synergy + quality = effective + clout here.
//   North: Ann momentum 100, active        -> effective 100 (scaled 100*2 = 200)
//          Bea momentum 120, not active    -> effective 60  (scaled 60*1 = 60)
//          strength 100 + 60 = 160 (scaled would give 260)
//   South: Cal momentum 60, patron Ann     -> net 160, effective 160 (clout 100, adjusted 260,
//                                              band B, x5 on this sheet: scaled 1300)
//          Dot momentum 40, active         -> effective 40 (scaled 40)
//          strength 160 + 40 = 200 (scaled would give 820)
//   East:  Eli momentum 3 + 3*(-3) = -6    -> effective -6 (band E, scaled 0)
//          Fia momentum 100, not active    -> effective 50 (scaled 50)
//          strength -6 + 50 = 44 (scaled would give 50)
test.describe('group figures from effective', () => {
  test('strength totals the members\' effective, not their scaled', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      // the sheet's own band multipliers: B is x5 here, not x3
      settings: { bandMultipliers: { A: 4, B: 5, C: 2, D: 1, E: 0 } },
      anchor: '2026-03-01',
      // Fia's beta change to 30 is dated after the anchor: it does not count yet
      history: [
        { personId: 6, field: 'beta', value: 30, from: '2026-04-01' },
      ],
      groups: [{ id: 1, name: 'North' }, { id: 2, name: 'South' }, { id: 3, name: 'East' }],
      people: [
        { id: 1, name: 'Ann', alpha: 5,  beta: 20, gamma: 5,  active: true,  groupId: 1, state: 'REVIEW' },
        { id: 2, name: 'Bea', alpha: 4,  beta: 30, gamma: 4,  active: false, groupId: 1, state: 'REVIEW' },
        { id: 3, name: 'Cal', alpha: 6,  beta: 10, gamma: 6,  active: true,  groupId: 2, state: 'REVIEW' },
        { id: 4, name: 'Dot', alpha: 5,  beta: 8,  gamma: 5,  active: true,  groupId: 2, state: 'REVIEW' },
        { id: 5, name: 'Eli', alpha: 3,  beta: 1,  gamma: 0,  active: true,  groupId: 3, state: 'REVIEW' },
        { id: 6, name: 'Fia', alpha: 10, beta: 10, gamma: 10, active: false, groupId: 3, state: 'REVIEW' },
      ],
      patrons: [{ personId: 3, patronId: 1 }],
    });
    await page.goto('/');

    await expect(page.getByTestId('person-row-3').getByTestId('concept-effective')).toHaveText('160');
    await expect(page.getByTestId('person-row-3').getByTestId('concept-scaled')).toHaveText('1300');
    await expect(page.getByTestId('group-row-1').getByTestId('group-concept-strength')).toHaveText('160');
    await expect(page.getByTestId('group-row-2').getByTestId('group-concept-strength')).toHaveText('200');
    await expect(page.getByTestId('group-row-3').getByTestId('group-concept-strength')).toHaveText('44');
    await expect(page.getByTestId('group-row-3').getByTestId('group-concept-size')).toHaveText('2');
  });
});
