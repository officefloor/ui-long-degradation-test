import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// global rank
test.describe('global rank', () => {
  test('rank across all people', { tag: '@functionality' }, async ({ page }) => {
    // Hela is on hold and in no group: left out of sheet-wide figures, counted at half in totals.
    // Her scaled is 2400 (thrust 600, drift 0, band A x4); counted, she would push everyone down
    // one place. She shows n/a for her own rank.
    // Sol is shared from sheet S9 and in no group: counted here like anyone (scaled 50, ranked 5th).
    // Scaled (adjusted * band multiplier): Eli 300*3 = 900, Bea 120*2 = 240, Ann 100*2 = 200,
    // Cal 60, Sol 50, Dot 40, Fia 30 (band D x1)
    await resetAndSeed({
      sheets: [
        { id: 'S9', people: [{ id: 1, name: 'Sol', alpha: 5, beta: 10, gamma: 5, active: true }] },
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

    await expect(page.getByTestId('person-row-1').getByTestId('concept-rank-global')).toHaveText('3');
    await expect(page.getByTestId('person-row-2').getByTestId('concept-rank-global')).toHaveText('2');
    await expect(page.getByTestId('person-row-3').getByTestId('concept-rank-global')).toHaveText('4');
    await expect(page.getByTestId('person-row-4').getByTestId('concept-rank-global')).toHaveText('6');
    await expect(page.getByTestId('person-row-5').getByTestId('concept-rank-global')).toHaveText('1');
    await expect(page.getByTestId('person-row-6').getByTestId('concept-rank-global')).toHaveText('7');
    await expect(page.getByTestId('person-row-9').getByTestId('concept-rank-global')).toHaveText('n/a');
  });

  // Tie-break: two people with equal scaled anywhere on the sheet.
  // Zed and Ann: alpha 5 * beta 12 = 60 momentum (gamma=alpha so drift 0); adjusted 60 in band D
  // (0..99) => *1 => scaled 60 each. Global rank is highest scaled first, and the scaled tie
  // breaks by name => Ann 1st, Zed 2nd (earlier name wins over the lower person id).
  // Hela is on hold and in no group: left out of sheet-wide figures, counted at half in totals.
  // Her scaled is 200 (thrust 100, drift 0, band C x2); counted, she would be 1st, Ann 2nd, Sol 3rd
  // and Zed 4th.
  test('global rank breaks ties by name', { tag: '@functionality' }, async ({ page }) => {
    // Sol is shared from sheet S9: counted here like anyone; his scaled 60 ties too, so Ann 1, Sol 2, Zed 3
    await resetAndSeed({
      sheets: [
        { id: 'S9', people: [{ id: 1, name: 'Sol', alpha: 5, beta: 12, gamma: 5, active: true }] },
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

    await expect(page.getByTestId('person-row-1').getByTestId('concept-rank-global')).toHaveText('3');
    await expect(page.getByTestId('person-row-2').getByTestId('concept-rank-global')).toHaveText('1');
    await expect(page.getByTestId('person-row-8').getByTestId('concept-rank-global')).toHaveText('2');
  });
});
