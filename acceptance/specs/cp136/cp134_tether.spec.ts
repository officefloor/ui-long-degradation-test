import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// Group members are in REVIEW: a member still in DRAFT would be left out of the group's figures.

// tether
test.describe('tether', () => {
  test('tether is scaled minus cohesion', { tag: '@functionality' }, async ({ page }) => {
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
        { id: 1, name: 'Ann', alpha: 5, beta: 20, gamma: 5, active: true, groupId: 1, state: 'REVIEW' },
        { id: 2, name: 'Bea', alpha: 4, beta: 30, gamma: 4, active: true, groupId: 1, state: 'REVIEW' },
        { id: 3, name: 'Cal', alpha: 6, beta: 10, gamma: 6, active: true, groupId: 2, state: 'REVIEW' },
        { id: 4, name: 'Dot', alpha: 5, beta: 8, gamma: 5, active: true, groupId: 2, state: 'REVIEW' },
        { id: 5, name: 'Eli', alpha: 10, beta: 30, gamma: 10, active: true, groupId: 3, state: 'REVIEW' },
        { id: 6, name: 'Fia', alpha: 5, beta: 6, gamma: 5, active: true, groupId: 3, state: 'REVIEW' },
      ],
    });
    await page.goto('/');

    await expect(page.getByTestId('person-row-1').getByTestId('concept-tether')).toHaveText('90');
    await expect(page.getByTestId('person-row-2').getByTestId('concept-tether')).toHaveText('130');
    await expect(page.getByTestId('person-row-3').getByTestId('concept-tether')).toHaveText('10');
    await expect(page.getByTestId('person-row-4').getByTestId('concept-tether')).toHaveText('-10');
    // Eli: momentum 300, band B x5 on this sheet = scaled 1500; East cohesion 330/2 = 165; 1500 - 165 = 1335
    await expect(page.getByTestId('person-row-5').getByTestId('concept-tether')).toHaveText('1335');
    await expect(page.getByTestId('person-row-6').getByTestId('concept-tether')).toHaveText('-135');
  });
});
