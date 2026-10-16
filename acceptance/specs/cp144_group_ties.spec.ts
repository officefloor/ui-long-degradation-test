import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// Every "top" or order of people inside a group breaks a tie by the higher alpha, then by the name
// earlier in the alphabet: the apex, and the order behind standing and rung. Group members are in
// REVIEW (a DRAFT member would be left out of the group's figures).
//
// Everyone active with no patrons: effective = momentum (gamma = alpha); scaled from the bands.
//   North: Ann alpha 4 * 25 = 100 (scaled 200), Bob alpha 5 * 20 = 100 (scaled 200), Cyd 20 (scaled 20)
//     Ann and Bob tie: Bob has the higher alpha -> apex Bob (not Ann by name)
//     standing Bob 1, Ann 2, Cyd 3 ; rung (3-1)*100/2 = 100, (3-2)*100/2 = 50, 0
//   South: Eve alpha 5 * 8 = 40, Dan alpha 5 * 8 = 40 (Eve listed first)
//     same value and same alpha: Dan's name comes first -> apex Dan, standing Dan 1, Eve 2,
//     rung Dan 100, Eve 0
test.describe('ties inside groups', () => {
  test('a tie inside a group goes to the higher alpha, then the earlier name', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      anchor: '2026-03-01',
      // Ann's beta change to 30 is dated after the anchor: it does not count yet
      history: [
        { personId: 1, field: 'beta', value: 30, from: '2026-04-01' },
      ],
      groups: [{ id: 1, name: 'North' }, { id: 2, name: 'South' }],
      people: [
        { id: 1, name: 'Ann', alpha: 4, beta: 25, gamma: 4, active: true, state: 'REVIEW' },
        { id: 2, name: 'Bob', alpha: 5, beta: 20, gamma: 5, active: true, state: 'REVIEW' },
        { id: 3, name: 'Cyd', alpha: 2, beta: 10, gamma: 2, active: true, state: 'REVIEW' },
        { id: 4, name: 'Eve', alpha: 5, beta: 8,  gamma: 5, active: true, state: 'REVIEW' },
        { id: 5, name: 'Dan', alpha: 5, beta: 8,  gamma: 5, active: true, state: 'REVIEW' },
      ],
      memberships: [{ personId: 1, groupId: 1 }, { personId: 2, groupId: 1 }, { personId: 3, groupId: 1 }, { personId: 4, groupId: 2 }, { personId: 5, groupId: 2 }],
    });
    await page.goto('/');

    await expect(page.getByTestId('group-row-1').getByTestId('group-concept-apex')).toHaveText('Bob');
    await expect(page.getByTestId('person-row-2').getByTestId('concept-standing')).toHaveText('1');
    await expect(page.getByTestId('person-row-1').getByTestId('concept-standing')).toHaveText('2');
    await expect(page.getByTestId('person-row-1').getByTestId('concept-rung')).toHaveText('50');
    await expect(page.getByTestId('person-row-3').getByTestId('concept-rung')).toHaveText('0');

    await expect(page.getByTestId('group-row-2').getByTestId('group-concept-apex')).toHaveText('Dan');
    await expect(page.getByTestId('person-row-5').getByTestId('concept-standing')).toHaveText('1');
    await expect(page.getByTestId('person-row-4').getByTestId('concept-standing')).toHaveText('2');
    await expect(page.getByTestId('person-row-5').getByTestId('concept-rung')).toHaveText('100');
    await expect(page.getByTestId('person-row-4').getByTestId('concept-rung')).toHaveText('0');
  });
});
