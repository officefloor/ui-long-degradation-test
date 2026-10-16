import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// strongest member: the highest scaled anywhere on the sheet. Eli momentum 300 -> band B x3 = 900;
// Sol (shared onto this sheet as row 8) momentum 400 -> band B x3 = 1200, so Sol is the strongest.
// Hela is on hold: left out of sheet-wide figures (momentum 600 -> band A x4 = 2400 would win).
test.describe('strongest member', () => {
  test('names the top-scaled person', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
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
      // Sol is shared from sheet S9: counted here like anyone
      sheets: [{ id: 'S9', people: [{ id: 1, name: 'Sol', alpha: 10, beta: 40, gamma: 10, active: true }] }],
      shares: [{ personId: 8, fromSheetId: 'S9', fromPersonId: 1 }],
      memberships: [{ personId: 1, groupId: 1 }, { personId: 2, groupId: 1 }, { personId: 3, groupId: 2 }, { personId: 4, groupId: 2 }, { personId: 5, groupId: 3 }, { personId: 6, groupId: 3 }],
    });
    await page.goto('/');

    await expect(page.getByTestId('rollup-strongest-member')).toHaveText('Sol');
  });
});
