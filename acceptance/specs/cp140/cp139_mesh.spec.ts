import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// Group members are in REVIEW: a member still in DRAFT would be left out of the group's figures.

test.describe('mesh', () => {
  test('scaled times size', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      // the sheet's own band multipliers: B is x5 here, not x3
      settings: { bandMultipliers: { A: 4, B: 5, C: 2, D: 1, E: 0 } },
      anchor: '2026-03-01',
      // Fia's beta change is dated after the anchor: it does not count yet
      history: [
        { personId: 6, field: 'beta', value: 70, from: '2026-04-01' },
      ],
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

    await expect(page.getByTestId('person-row-1').getByTestId('concept-mesh')).toHaveText('400');
    await expect(page.getByTestId('person-row-2').getByTestId('concept-mesh')).toHaveText('480');
    await expect(page.getByTestId('person-row-3').getByTestId('concept-mesh')).toHaveText('120');
    await expect(page.getByTestId('person-row-4').getByTestId('concept-mesh')).toHaveText('80');
    // Eli: momentum 300, band B x5 on this sheet = scaled 1500; East size 2; 1500 * 2 = 3000
    await expect(page.getByTestId('person-row-5').getByTestId('concept-mesh')).toHaveText('3000');
    await expect(page.getByTestId('person-row-6').getByTestId('concept-mesh')).toHaveText('60');
  });
});
