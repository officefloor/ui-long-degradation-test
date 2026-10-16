import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// In every figure across all the groups, a person who is in no group counts as a group of their own,
// named after them and holding only them. It follows every group rule (a held person counts at half in
// its strength and not in its size; a DRAFT person leaves it empty) and still counts as a group. It
// has no group row, and the person's own figures from their group stay n/a. Hela is on hold.
//
// Everyone active with no patrons: effective = momentum (gamma = alpha). Groups use effective.
//   North: Ann 100, Bea 40 -> strength 140 ; East: Eve 50, Fay 40 -> 90 ; South: Cal 60 -> 60
//   in no group: Zed 200 (REVIEW) -> 200 ; Hela 30 (on hold) -> 30/2 = 15, size 0 ;
//                Dex 80 (DRAFT) -> strength 0, size 0
// groups: Zed 200, North 140, East 90, South 60, Hela 15, Dex 0 -> 6 groups
//   strongest Zed (size 1) ; total strength 200+140+90+60+15+0 = 505
//   middle strength of 0, 15, 60, 90, 140, 200 -> lower of the two middles: 60
//   ranks: Zed 1, North 2, East 3, South 4 ; Ann's group rank 2 ; Zed's own group rank n/a
// The anchor is 2026-03-01. Zed's beta becomes 10 from 2026-04-01: a change dated after the anchor does not count yet.
test.describe('a group of their own', () => {
  test('people in no group count as groups of their own across all groups', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      anchor: '2026-03-01',
      groups: [{ id: 1, name: 'North' }, { id: 2, name: 'South' }, { id: 3, name: 'East' }],
      people: [
        { id: 1, name: 'Ann',  alpha: 5,  beta: 20, gamma: 5,  active: true, state: 'REVIEW' },
        { id: 2, name: 'Bea',  alpha: 4,  beta: 10, gamma: 4,  active: true, state: 'REVIEW' },
        { id: 3, name: 'Cal',  alpha: 6,  beta: 10, gamma: 6,  active: true, state: 'REVIEW' },
        { id: 4, name: 'Eve',  alpha: 5,  beta: 10, gamma: 5,  active: true, state: 'REVIEW' },
        { id: 5, name: 'Fay',  alpha: 4,  beta: 10, gamma: 4,  active: true, state: 'REVIEW' },
        { id: 6, name: 'Zed',  alpha: 10, beta: 20, gamma: 10, active: true, state: 'REVIEW' },
        { id: 7, name: 'Dex',  alpha: 8,  beta: 10, gamma: 8,  active: true, state: 'DRAFT' },
        { id: 9, name: 'Hela', alpha: 5,  beta: 6,  gamma: 5,  active: true, state: 'REVIEW', hold: true },
      ],
      memberships: [
        { personId: 1, groupId: 1 }, { personId: 2, groupId: 1 },
        { personId: 3, groupId: 2 },
        { personId: 4, groupId: 3 }, { personId: 5, groupId: 3 },
      ],
      history: [{ personId: 6, field: 'beta', value: 10, from: '2026-04-01' }],
    });
    await page.goto('/');

    await expect(page.getByTestId(/^group-row-/)).toHaveCount(3); // no rows for the groups of one
    await expect(page.getByTestId('rollup-biggest-group')).toHaveText('Zed');
    await expect(page.getByTestId('rollup-top-group-size')).toHaveText('1');
    await expect(page.getByTestId('rollup-total-strength')).toHaveText('505');
    await expect(page.getByTestId('rollup-group-count')).toHaveText('6');
    await expect(page.getByTestId('rollup-median-strength')).toHaveText('60');
    await expect(page.getByTestId('group-row-1').getByTestId('group-concept-rank')).toHaveText('2');
    await expect(page.getByTestId('group-row-2').getByTestId('group-concept-rank')).toHaveText('4');
    await expect(page.getByTestId('person-row-1').getByTestId('concept-group-rank')).toHaveText('2');
    await expect(page.getByTestId('person-row-6').getByTestId('concept-group-rank')).toHaveText('n/a');

    // as of 2026-04-01 Zed's change counts: Zed 10*10 = 100, so North (140) is the strongest
    await page.getByTestId('sheet-as-of').fill('2026-04-01');
    await page.getByTestId('sheet-as-of-apply').click();
    await expect(page.getByTestId('rollup-biggest-group')).toHaveText('North');
  });
});
