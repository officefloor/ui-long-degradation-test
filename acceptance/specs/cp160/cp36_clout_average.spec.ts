import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// rounded to the nearest, a half rounding up); no patrons is still 0. That lowers Kai's clout and flips the leader.
//   clout: Uma 0, Ivo 0, Dana 100/1=100, Kai (133+60+10)/3 = 67.7 -> 68 (Sol's 10 included)
//   influence: Uma 100, Ivo 60, Dana 233, Kai (82+10)+68 = 160 (Sol adds 10 to Kai's backing)
//   top influence: Dana (233) now beats Kai (160)

// Sol is shared from sheet S9 as row 8: counted here like anyone. Sol (effective 2*5 = 10) is also Kai's patron.
// The anchor is 2026-03-01. Uma's beta becomes 30 from 2026-04-01: a change dated after the anchor does not count yet.
test.describe('clout as average', () => {
  test('clout averages patrons effective and the leader flips', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
  anchor: '2026-03-01',
  people: [
    { id: 1, name: 'Uma',  alpha: 5, beta: 20, gamma: 5,  active: true },
    { id: 2, name: 'Ivo',  alpha: 2, beta: 30, gamma: 2,  active: true },
    { id: 3, name: 'Dana', alpha: 3, beta: 4,  gamma: 10, active: true },
    { id: 4, name: 'Kai',  alpha: 2, beta: 5,  gamma: 2,  active: true },
    // Hela is on hold: she counts in nobody's patron figures, so Kai's clout leaves her out
    { id: 9, name: 'Hela', alpha: 10, beta: 10, gamma: 10, active: true, hold: true },
  ],
  patrons: [
    { personId: 3, patronId: 1 },
    { personId: 4, patronId: 3 }, { personId: 4, patronId: 2 }, { personId: 4, patronId: 9 }, { personId: 4, patronId: 8 },
  ],
  sheets: [{ id: 'S9', people: [{ id: 1, name: 'Sol', alpha: 2, beta: 5, gamma: 2, active: true }] }],
  shares: [{ personId: 8, fromSheetId: 'S9', fromPersonId: 1 }],
  history: [{ personId: 1, field: 'beta', value: 30, from: '2026-04-01' }],
});
    await page.goto('/');

    await expect(page.getByTestId('person-row-3').getByTestId('concept-clout')).toHaveText('100');
    await expect(page.getByTestId('person-row-4').getByTestId('concept-clout')).toHaveText('68');

    await expect(page.getByTestId('person-row-3').getByTestId('concept-influence')).toHaveText('233');
    await expect(page.getByTestId('person-row-4').getByTestId('concept-influence')).toHaveText('160');

    await expect(page.getByTestId('rollup-top-influence')).toHaveText('Dana');
  });
});
