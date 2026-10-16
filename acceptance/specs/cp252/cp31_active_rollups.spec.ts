import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// An inactive person's effective is half of net, rounded to the nearest (a half rounds up).
// active count is unchanged.

test.describe('active rollups', () => {
  test('active count and total effective', { tag: '@functionality' }, async ({ page }) => {
    // Sol is shared from sheet S9 as row 8: counted here like anyone (active, effective 10).
    // A change dated after the anchor does not count yet: Dana's beta 8 from 2026-04-01.
    await resetAndSeed({
  anchor: '2026-03-01',
  people: [
    { id: 1, name: 'Dana', alpha: 3, beta: 4,  gamma: 10, active: true },  // effective 33
    { id: 2, name: 'Ravi', alpha: 7, beta: 2,  gamma: 5,  active: false }, // effective 4
    { id: 3, name: 'Uma',  alpha: 5, beta: 20, gamma: 5,  active: true },  // effective 100
    { id: 4, name: 'Odd',  alpha: 3, beta: 3,  gamma: 3,  active: false }, // effective 9/2 = 4.5 -> 5
    { id: 9, name: 'Hela', alpha: 5, beta: 5,  gamma: 5,  active: true, hold: true }, // on hold: effective 25, counted at 25/2 = 12.5 -> 13
  ],
  sheets: [
    { id: 'S9', people: [
      { id: 1, name: 'Sol', alpha: 2, beta: 5, gamma: 2, active: true },
    ] },
  ],
  shares: [{ personId: 8, fromSheetId: 'S9', fromPersonId: 1 }],
  history: [{ personId: 1, field: 'beta', value: 8, from: '2026-04-01' }],
});
    await page.goto('/');

    await expect(page.getByTestId('rollup-active-count')).toHaveText('3'); // Dana, Uma, Sol (Hela is on hold)
    // rollup-total-effective: Dana 33 + Ravi 4 + Uma 100 + Odd 5 + Hela 13 (half of 25) + Sol 10 = 165; leave out the highest contribution, Uma's 100 -> 65
    await expect(page.getByTestId('rollup-total-effective')).toHaveText('61');

    // as of 2026-05-01 Dana's beta 8 counts: momentum 3*8 + 3*(10-3) = 45, effective 45;
    // 45 + 4 + 100 + 5 + 13 + 10 = 177, Uma's 100 left out -> 77
    await page.getByTestId('sheet-as-of').fill('2026-05-01');
    await page.getByTestId('sheet-as-of-apply').click();
    await expect(page.getByTestId('rollup-total-effective')).toHaveText('73');
  });
});
