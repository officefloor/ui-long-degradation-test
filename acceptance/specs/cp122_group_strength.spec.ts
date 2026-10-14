import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// cp122: group strength
test.describe('group strength', () => {
  test('strength sums members\' scaled', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      groups: [{ id: 1, name: 'North' }, { id: 2, name: 'South' }, { id: 3, name: 'East' }],
      people: [
        { id: 1, name: 'Ann', alpha: 5, beta: 20, gamma: 5, active: true, groupId: 1 },
        { id: 2, name: 'Bea', alpha: 4, beta: 30, gamma: 4, active: true, groupId: 1 },
        { id: 3, name: 'Cal', alpha: 6, beta: 10, gamma: 6, active: true, groupId: 2 },
        { id: 4, name: 'Dot', alpha: 5, beta: 8, gamma: 5, active: true, groupId: 2 },
        { id: 5, name: 'Eli', alpha: 10, beta: 30, gamma: 10, active: true, groupId: 3 },
        { id: 6, name: 'Fia', alpha: 5, beta: 6, gamma: 5, active: true, groupId: 3 },
      ],
    });
    await page.goto('/');

    await expect(page.getByTestId('group-row-1').getByTestId('group-concept-strength')).toHaveText('440');
    await expect(page.getByTestId('group-row-2').getByTestId('group-concept-strength')).toHaveText('100');
    await expect(page.getByTestId('group-row-3').getByTestId('group-concept-strength')).toHaveText('930');
  });
});
