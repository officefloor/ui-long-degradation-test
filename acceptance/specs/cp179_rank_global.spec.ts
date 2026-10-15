import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// global rank
test.describe('global rank', () => {
  test('rank across all people', { tag: '@functionality' }, async ({ page }) => {
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
      memberships: [{ personId: 1, groupId: 1 }, { personId: 2, groupId: 1 }, { personId: 3, groupId: 2 }, { personId: 4, groupId: 2 }, { personId: 5, groupId: 3 }, { personId: 6, groupId: 3 }],
    });
    await page.goto('/');

    await expect(page.getByTestId('person-row-1').getByTestId('concept-rank-global')).toHaveText('3');
    await expect(page.getByTestId('person-row-2').getByTestId('concept-rank-global')).toHaveText('2');
    await expect(page.getByTestId('person-row-3').getByTestId('concept-rank-global')).toHaveText('4');
    await expect(page.getByTestId('person-row-4').getByTestId('concept-rank-global')).toHaveText('5');
    await expect(page.getByTestId('person-row-5').getByTestId('concept-rank-global')).toHaveText('1');
    await expect(page.getByTestId('person-row-6').getByTestId('concept-rank-global')).toHaveText('6');
  });

  // Tie-break: two people with equal scaled anywhere on the sheet.
  // Zed and Ann: alpha 5 * beta 12 = 60 momentum (gamma=alpha so drift 0); adjusted 60 in band D
  // (0..99) => *1 => scaled 60 each. Global rank is highest scaled first, and the scaled tie
  // breaks by name => Ann 1st, Zed 2nd (earlier name wins over the lower person id).
  test('global rank breaks ties by name', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      groups: [{ id: 1, name: 'North' }],
      people: [
        { id: 1, name: 'Zed', alpha: 5, beta: 12, gamma: 5, active: true },
        { id: 2, name: 'Ann', alpha: 5, beta: 12, gamma: 5, active: true },
      ],
      memberships: [{ personId: 1, groupId: 1 }, { personId: 2, groupId: 1 }],
    });
    await page.goto('/');

    await expect(page.getByTestId('person-row-1').getByTestId('concept-rank-global')).toHaveText('2');
    await expect(page.getByTestId('person-row-2').getByTestId('concept-rank-global')).toHaveText('1');
  });
});
