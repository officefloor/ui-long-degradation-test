import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// person group rank
test.describe('person group rank', () => {
  // Everyone is in REVIEW, so every member counts. Each person is active with gamma = alpha and no
  // patrons, so effective = alpha * beta: North = Ann 100 + Bea 120 = 220, South = Cal 60 + Dot 40
  // = 100, East = Eli 300 + Fia 30 = 330.
  // Group ranks: East 1, North 2, South 3; each person shows the rank of the group they are in.
  test('the home group\'s rank', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      groups: [{ id: 1, name: 'North' }, { id: 2, name: 'South' }, { id: 3, name: 'East' }],
      people: [
        { id: 1, name: 'Ann', alpha: 5, beta: 20, gamma: 5, active: true, state: 'REVIEW' },
        { id: 2, name: 'Bea', alpha: 4, beta: 30, gamma: 4, active: true, state: 'REVIEW' },
        { id: 3, name: 'Cal', alpha: 6, beta: 10, gamma: 6, active: true, state: 'REVIEW' },
        { id: 4, name: 'Dot', alpha: 5, beta: 8, gamma: 5, active: true, state: 'REVIEW' },
        { id: 5, name: 'Eli', alpha: 10, beta: 30, gamma: 10, active: true, state: 'REVIEW' },
        { id: 6, name: 'Fia', alpha: 5, beta: 6, gamma: 5, active: true, state: 'REVIEW' },
      ],
      memberships: [{ personId: 1, groupId: 1 }, { personId: 2, groupId: 1 }, { personId: 3, groupId: 2 }, { personId: 4, groupId: 2 }, { personId: 5, groupId: 3 }, { personId: 6, groupId: 3 }],
    });
    await page.goto('/');

    await expect(page.getByTestId('person-row-1').getByTestId('concept-group-rank')).toHaveText('2');
    await expect(page.getByTestId('person-row-2').getByTestId('concept-group-rank')).toHaveText('2');
    await expect(page.getByTestId('person-row-3').getByTestId('concept-group-rank')).toHaveText('3');
    await expect(page.getByTestId('person-row-4').getByTestId('concept-group-rank')).toHaveText('3');
    await expect(page.getByTestId('person-row-5').getByTestId('concept-group-rank')).toHaveText('1');
    await expect(page.getByTestId('person-row-6').getByTestId('concept-group-rank')).toHaveText('1');
  });
});
