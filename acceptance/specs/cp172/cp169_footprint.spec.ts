import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// This sheet's own band multiplier for B is 5 (the rest as usual): Eli's 300 is in B, so his scaled
// is 300*5 = 1500 (it would be 900 on the usual multipliers).
// The anchor is 2026-03-01. Eli's beta becomes 40 from 2026-04-01: a change dated after the anchor
// does not count yet, so Eli is still 10*30 = 300.
// Eli's footprint = 2 * 1500 = 3000.
test.describe('footprint', () => {
  test('twice scaled', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      settings: { bandMultipliers: { B: 5 } },
      anchor: '2026-03-01',
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
      history: [{ personId: 5, field: 'beta', value: 40, from: '2026-04-01' }],
    });
    await page.goto('/');

    await expect(page.getByTestId('person-row-1').getByTestId('concept-footprint')).toHaveText('400');
    await expect(page.getByTestId('person-row-2').getByTestId('concept-footprint')).toHaveText('480');
    await expect(page.getByTestId('person-row-3').getByTestId('concept-footprint')).toHaveText('120');
    await expect(page.getByTestId('person-row-4').getByTestId('concept-footprint')).toHaveText('80');
    await expect(page.getByTestId('person-row-5').getByTestId('concept-footprint')).toHaveText('3000');
    await expect(page.getByTestId('person-row-6').getByTestId('concept-footprint')).toHaveText('60');
  });
});
