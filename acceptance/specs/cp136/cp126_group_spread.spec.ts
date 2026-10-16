import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// Group members are in REVIEW: a member still in DRAFT would be left out of the group's figures.

// spread: the highest minus the lowest of the members' values, and a group figure worked out from
// members' values uses their effective. Everyone active with no patrons: effective = momentum.
//   North Ann 100, Bea 120 -> 20 ; South Cal 60, Dot 40 -> 20 ; East Eli 300, Fia 30 -> 270
test.describe('spread', () => {
  test('spread uses effective', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      anchor: '2026-03-01',
      // Ann's beta was 10 until 2026-02-01; Fia's change is dated after the anchor and does not count yet
      history: [
        { personId: 1, field: 'beta', value: 20, from: '2026-02-01' },
        { personId: 6, field: 'beta', value: 70, from: '2026-04-01' },
      ],
      groups: [{ id: 1, name: 'North' }, { id: 2, name: 'South' }, { id: 3, name: 'East' }],
      people: [
        { id: 1, name: 'Ann', alpha: 5, beta: 10, gamma: 5, active: true, groupId: 1, state: 'REVIEW' },
        { id: 2, name: 'Bea', alpha: 4, beta: 30, gamma: 4, active: true, groupId: 1, state: 'REVIEW' },
        { id: 3, name: 'Cal', alpha: 6, beta: 10, gamma: 6, active: true, groupId: 2, state: 'REVIEW' },
        { id: 4, name: 'Dot', alpha: 5, beta: 8, gamma: 5, active: true, groupId: 2, state: 'REVIEW' },
        { id: 5, name: 'Eli', alpha: 10, beta: 30, gamma: 10, active: true, groupId: 3, state: 'REVIEW' },
        { id: 6, name: 'Fia', alpha: 5, beta: 6, gamma: 5, active: true, groupId: 3, state: 'REVIEW' },
      ],
    });
    await page.goto('/');

    await expect(page.getByTestId('group-row-1').getByTestId('group-concept-spread')).toHaveText('20');
    await expect(page.getByTestId('group-row-2').getByTestId('group-concept-spread')).toHaveText('20');
    await expect(page.getByTestId('group-row-3').getByTestId('group-concept-spread')).toHaveText('270');

    // as of 2026-01-15, before Ann's beta change: her beta was 10, momentum 50
    //   North spread 120 - 50 = 70
    await page.getByTestId('sheet-as-of').fill('2026-01-15');
    await page.getByTestId('sheet-as-of-apply').click();
    await expect(page.getByTestId('group-row-1').getByTestId('group-concept-spread')).toHaveText('70');
  });
});
