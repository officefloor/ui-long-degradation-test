import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// biggest group
test.describe('biggest group', () => {
  // Everyone is in REVIEW, so every member counts. Each person is active with gamma = alpha and no
  // patrons, so effective = alpha * beta: North = Ann 100 + Bea 120 = 220, South = Cal 60 + Dot 40
  // = 100, East = Eli 300 + Fia 30 = 330.
  // The highest strength is East's 330 => East.
  test('names the strongest group', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      groups: [{ id: 1, name: 'North' }, { id: 2, name: 'South' }, { id: 3, name: 'East' }],
      people: [
        { id: 1, name: 'Ann', alpha: 5, beta: 20, gamma: 5, active: true, state: 'REVIEW', groupId: 1 },
        { id: 2, name: 'Bea', alpha: 4, beta: 30, gamma: 4, active: true, state: 'REVIEW', groupId: 1 },
        { id: 3, name: 'Cal', alpha: 6, beta: 10, gamma: 6, active: true, state: 'REVIEW', groupId: 2 },
        { id: 4, name: 'Dot', alpha: 5, beta: 8, gamma: 5, active: true, state: 'REVIEW', groupId: 2 },
        { id: 5, name: 'Eli', alpha: 10, beta: 30, gamma: 10, active: true, state: 'REVIEW', groupId: 3 },
        { id: 6, name: 'Fia', alpha: 5, beta: 6, gamma: 5, active: true, state: 'REVIEW', groupId: 3 },
      ],
    });
    await page.goto('/');

    await expect(page.getByTestId('rollup-biggest-group')).toHaveText('East');
  });
});
