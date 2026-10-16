import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// A group can sit inside another group (its parent, shown by name; blank for none). A parent group's
// figures include the members of every group inside it, at any depth, each person once. A person
// still belongs only to the groups they were put in. Figures across all groups take each group's
// own figures. Group members are in REVIEW (a DRAFT member would be left out of the group's figures).
//
// Everyone active with no patrons: effective = momentum (gamma = alpha); scaled from the bands.
//   Ann 100, Bob 60, Cyd 40, Dee 30, Eve 150 (scaled 300)
//   Org (top):           put in it: Ann
//   Team A (in Org):     put in it: Bob, Cyd
//   Team B (in Org):     put in it: Dee, Ann
//   Squad (in Team A):   put in it: Eve
// Org    members Ann, Bob, Cyd, Dee, Eve (Ann once): strength 380, size 5, cohesion 76,
//        spread 150-30 = 120, apex Eve, density 2 (Ann, Eve at or above 76)
// Team A members Bob, Cyd, Eve: strength 250, size 3, cohesion 83, apex Eve
// Team B members Dee, Ann: strength 130, size 2 ; Squad Eve: strength 150, size 1
// total strength 380 + 250 + 130 + 150 = 910 ; group ranks Org 1, Team A 2, Squad 3, Team B 4
// Bob is only in Team A: groups 'Team A', anchorage 1, standing 2 there (Eve 300, Bob 60, Cyd 40)
// The anchor is 2026-03-01. Eve's beta becomes 40 from 2026-04-01: a change dated after the anchor does not count yet.
test.describe('groups inside groups', () => {
  test('a parent group counts the members of the groups inside it once each', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      anchor: '2026-03-01',
      groups: [
        { id: 1, name: 'Org' },
        { id: 2, name: 'Team A', parentId: 1 },
        { id: 3, name: 'Team B', parentId: 1 },
        { id: 4, name: 'Squad',  parentId: 2 },
      ],
      people: [
        { id: 1, name: 'Ann', alpha: 5, beta: 20, gamma: 5, active: true, state: 'REVIEW' },
        { id: 2, name: 'Bob', alpha: 6, beta: 10, gamma: 6, active: true, state: 'REVIEW' },
        { id: 3, name: 'Cyd', alpha: 5, beta: 8,  gamma: 5, active: true, state: 'REVIEW' },
        { id: 4, name: 'Dee', alpha: 3, beta: 10, gamma: 3, active: true, state: 'REVIEW' },
        { id: 5, name: 'Eve', alpha: 5, beta: 30, gamma: 5, active: true, state: 'REVIEW' },
      ],
      memberships: [
        { personId: 1, groupId: 1 },
        { personId: 2, groupId: 2 }, { personId: 3, groupId: 2 },
        { personId: 4, groupId: 3 }, { personId: 1, groupId: 3 },
        { personId: 5, groupId: 4 },
      ],
      history: [{ personId: 5, field: 'beta', value: 40, from: '2026-04-01' }],
    });
    await page.goto('/');

    await expect(page.getByTestId('group-row-1').getByTestId('group-parent')).toHaveText('');
    await expect(page.getByTestId('group-row-4').getByTestId('group-parent')).toHaveText('Team A');
    await expect(page.getByTestId('group-row-1').getByTestId('group-concept-strength')).toHaveText('380');
    await expect(page.getByTestId('group-row-1').getByTestId('group-concept-size')).toHaveText('5');
    await expect(page.getByTestId('group-row-1').getByTestId('group-concept-cohesion')).toHaveText('76');
    await expect(page.getByTestId('group-row-1').getByTestId('group-concept-spread')).toHaveText('120');
    await expect(page.getByTestId('group-row-1').getByTestId('group-concept-apex')).toHaveText('Eve');
    await expect(page.getByTestId('group-row-1').getByTestId('group-concept-density')).toHaveText('2');
    await expect(page.getByTestId('group-row-2').getByTestId('group-concept-strength')).toHaveText('250');
    await expect(page.getByTestId('group-row-2').getByTestId('group-concept-size')).toHaveText('3');
    await expect(page.getByTestId('rollup-total-strength')).toHaveText('910');
    await expect(page.getByTestId('group-row-4').getByTestId('group-concept-rank')).toHaveText('3');
    await expect(page.getByTestId('person-row-2').getByTestId('person-group')).toHaveText('Team A');
    await expect(page.getByTestId('person-row-2').getByTestId('concept-anchorage')).toHaveText('1');
    await expect(page.getByTestId('person-row-2').getByTestId('concept-standing')).toHaveText('2');

    // as of 2026-04-01 Eve's change counts: Eve 5*40 = 200, Org 100+60+40+30+200 = 430
    await page.getByTestId('sheet-as-of').fill('2026-04-01');
    await page.getByTestId('sheet-as-of-apply').click();
    await expect(page.getByTestId('group-row-1').getByTestId('group-concept-strength')).toHaveText('430');
  });
});
