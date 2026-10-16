import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// A member whose state is DRAFT is left out of every figure for their groups, strength included,
// and has no place in the order within the group. Members in REVIEW, FINAL or REWORK count. A held
// member counts at half in strength (Hela), and a held DRAFT member would be left out entirely.
//
// Everyone active with no patrons: effective = momentum (gamma = alpha); scaled from the bands
// (this sheet multiplies band C by 3).
//   North: Ann FINAL 100 (scaled 300), Bea DRAFT 120 (scaled 360), Cal REVIEW 60 (scaled 60),
//          Hela REVIEW 80, on hold -> 40 in strength
//     strength 100 + 60 + 40 = 200 (not 320), size 2 (Ann, Cal), cohesion 200/2 = 100,
//     spread 100 - 60 = 40, apex Ann (not Bea), density 1 (Ann at or above 100)
//     standing by scaled: Ann 1, Cal 2, Bea n/a ; share Ann 300*100/200 = 150, Cal 60*100/200 = 30
//   South: Dot REWORK 40, Eve DRAFT 500 -> strength 40 (not 540), size 1
//   strongest group: North 200 > South 40 (counting Eve, South would be 540)
test.describe('DRAFT members leave group figures', () => {
  test('group figures leave out DRAFT members', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      // the sheet's own band multipliers: C is x3 here, not x2
      settings: { bandMultipliers: { A: 4, B: 3, C: 3, D: 1, E: 0 } },
      anchor: '2026-03-01',
      // Cal's beta change to 20 is dated after the anchor: it does not count yet
      history: [
        { personId: 3, field: 'beta', value: 20, from: '2026-04-01' },
      ],
      groups: [{ id: 1, name: 'North' }, { id: 2, name: 'South' }],
      people: [
        { id: 1, name: 'Ann',  alpha: 5,  beta: 20, gamma: 5,  active: true, state: 'FINAL',  groupId: 1 },
        { id: 2, name: 'Bea',  alpha: 4,  beta: 30, gamma: 4,  active: true, state: 'DRAFT',  groupId: 1 },
        { id: 3, name: 'Cal',  alpha: 6,  beta: 10, gamma: 6,  active: true, state: 'REVIEW', groupId: 1 },
        { id: 4, name: 'Dot',  alpha: 5,  beta: 8,  gamma: 5,  active: true, state: 'REWORK', groupId: 2 },
        { id: 5, name: 'Eve',  alpha: 10, beta: 50, gamma: 10, active: true, state: 'DRAFT',  groupId: 2 },
        { id: 9, name: 'Hela', alpha: 4,  beta: 20, gamma: 4,  active: true, state: 'REVIEW', groupId: 1, hold: true },
      ],
    });
    await page.goto('/');

    await expect(page.getByTestId('group-row-1').getByTestId('group-concept-strength')).toHaveText('200');
    await expect(page.getByTestId('group-row-1').getByTestId('group-concept-size')).toHaveText('2');
    await expect(page.getByTestId('group-row-1').getByTestId('group-concept-cohesion')).toHaveText('100');
    await expect(page.getByTestId('group-row-1').getByTestId('group-concept-spread')).toHaveText('40');
    await expect(page.getByTestId('group-row-1').getByTestId('group-concept-apex')).toHaveText('Ann');
    await expect(page.getByTestId('group-row-1').getByTestId('group-concept-density')).toHaveText('1');
    await expect(page.getByTestId('group-row-2').getByTestId('group-concept-strength')).toHaveText('40');
    await expect(page.getByTestId('group-row-2').getByTestId('group-concept-size')).toHaveText('1');
    await expect(page.getByTestId('person-row-1').getByTestId('concept-standing')).toHaveText('1');
    await expect(page.getByTestId('person-row-3').getByTestId('concept-standing')).toHaveText('2');
    await expect(page.getByTestId('person-row-2').getByTestId('concept-standing')).toHaveText('n/a');
    await expect(page.getByTestId('person-row-1').getByTestId('concept-share')).toHaveText('150');
    await expect(page.getByTestId('person-row-3').getByTestId('concept-share')).toHaveText('30');
    await expect(page.getByTestId('rollup-biggest-group')).toHaveText('North');
  });
});
