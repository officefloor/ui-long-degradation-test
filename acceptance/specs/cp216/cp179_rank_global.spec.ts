import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// global rank
test.describe('global rank', () => {
  test('rank across all people', { tag: '@functionality' }, async ({ page }) => {
    // Hela is on hold and in no group: left out of sheet-wide figures, counted at half in totals.
    // Her scaled is 2400 (thrust 600, drift 0, band A x4); counted, she would push everyone down
    // one place. She shows n/a for her own rank.
    // Sol is shared from sheet S9: ranked here like anyone (momentum 11 * 10 = 110, band C x2 -> scaled 220),
    // between Bea 240 and Ann 200: Eli 900 -> 1, Bea 240 -> 2, Sol 220 -> 3, Ann 200 -> 4, Cal 60 -> 5,
    // Dot 40 -> 6, Fia 30 -> 7.
    // A change dated after the anchor does not count yet: Fia's beta 50 from 2026-04-01 (momentum 250,
    // band B x3 -> scaled 750) would put her second.
    await resetAndSeed({
      anchor: '2026-03-01',
      history: [{ personId: 6, field: 'beta', value: 50, from: '2026-04-01' }],
      sheets: [
        { id: 'S9', people: [
          { id: 1, name: 'Sol', alpha: 11, beta: 10, gamma: 11, active: true },
        ] },
      ],
      shares: [{ personId: 8, fromSheetId: 'S9', fromPersonId: 1 }],
      groups: [{ id: 1, name: 'North' }, { id: 2, name: 'South' }, { id: 3, name: 'East' }],
      people: [
        { id: 1, name: 'Ann', alpha: 5, beta: 20, gamma: 5, active: true },
        { id: 2, name: 'Bea', alpha: 4, beta: 30, gamma: 4, active: true },
        { id: 3, name: 'Cal', alpha: 6, beta: 10, gamma: 6, active: true },
        { id: 4, name: 'Dot', alpha: 5, beta: 8, gamma: 5, active: true },
        { id: 5, name: 'Eli', alpha: 10, beta: 30, gamma: 10, active: true },
        { id: 6, name: 'Fia', alpha: 5, beta: 6, gamma: 5, active: true },
        { id: 9, name: 'Hela', alpha: 10, beta: 60, gamma: 10, active: true, hold: true },
      ],
      memberships: [{ personId: 1, groupId: 1 }, { personId: 2, groupId: 1 }, { personId: 3, groupId: 2 }, { personId: 4, groupId: 2 }, { personId: 5, groupId: 3 }, { personId: 6, groupId: 3 }],
    });
    await page.goto('/');

    await expect(page.getByTestId('person-row-1').getByTestId('concept-rank-global')).toHaveText('4');
    await expect(page.getByTestId('person-row-2').getByTestId('concept-rank-global')).toHaveText('2');
    await expect(page.getByTestId('person-row-3').getByTestId('concept-rank-global')).toHaveText('5');
    await expect(page.getByTestId('person-row-4').getByTestId('concept-rank-global')).toHaveText('6');
    await expect(page.getByTestId('person-row-5').getByTestId('concept-rank-global')).toHaveText('1');
    await expect(page.getByTestId('person-row-6').getByTestId('concept-rank-global')).toHaveText('7');
    await expect(page.getByTestId('person-row-8').getByTestId('concept-rank-global')).toHaveText('3');
    await expect(page.getByTestId('person-row-9').getByTestId('concept-rank-global')).toHaveText('n/a');
  });

  // Two people with equal scaled share a rank (ranks are dense).
  // Zed and Ann: alpha 5 * beta 12 = 60 momentum (gamma=alpha so drift 0); adjusted 60 in band D
  // (0..99) => *1 => scaled 60 each, so both are 2nd, behind Sol.
  // Sol is shared from sheet S9: ranked here like anyone (momentum 9 * 10 = 90, band D -> scaled 90) -> 1st.
  // Hela is on hold and in no group: left out of sheet-wide figures, counted at half in totals.
  // Her scaled is 200 (thrust 100, drift 0, band C x2); counted, Ann and Zed would both be 3rd.
  test('level scaled shares a global rank', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      sheets: [
        { id: 'S9', people: [
          { id: 1, name: 'Sol', alpha: 9, beta: 10, gamma: 9, active: true },
        ] },
      ],
      shares: [{ personId: 8, fromSheetId: 'S9', fromPersonId: 1 }],
      groups: [{ id: 1, name: 'North' }],
      people: [
        { id: 1, name: 'Zed', alpha: 5, beta: 12, gamma: 5, active: true },
        { id: 2, name: 'Ann', alpha: 5, beta: 12, gamma: 5, active: true },
        { id: 9, name: 'Hela', alpha: 10, beta: 10, gamma: 10, active: true, hold: true },
      ],
      memberships: [{ personId: 1, groupId: 1 }, { personId: 2, groupId: 1 }],
    });
    await page.goto('/');

    await expect(page.getByTestId('person-row-1').getByTestId('concept-rank-global')).toHaveText('2');
    await expect(page.getByTestId('person-row-2').getByTestId('concept-rank-global')).toHaveText('2');
  });
});
