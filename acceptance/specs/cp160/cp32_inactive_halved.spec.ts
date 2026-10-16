import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// (was 0). Active people are unchanged. total effective follows; active count is unchanged.

// Sol is shared from sheet S9 as row 8: counted here like anyone. Sol's effective is 2*5 = 10 and Sol is active.
// The anchor is 2026-03-01. Uma's beta becomes 30 from 2026-04-01: a change dated after the anchor does not count yet.
test.describe('inactive halved', () => {
  test('inactive effective is half of net to the nearest', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
  anchor: '2026-03-01',
  people: [
    { id: 1, name: 'Dana', alpha: 3, beta: 4,  gamma: 10, active: true },  // net 33, active -> 33
    { id: 2, name: 'Ravi', alpha: 7, beta: 2,  gamma: 5,  active: false }, // net 8  -> 8/2 = 4
    { id: 3, name: 'Uma',  alpha: 5, beta: 20, gamma: 5,  active: true },  // net 100 -> 100
    { id: 4, name: 'Odd',  alpha: 3, beta: 3,  gamma: 3,  active: false }, // net 9  -> 9/2 = 4.5 -> 5
    { id: 9, name: 'Hela', alpha: 5, beta: 5,  gamma: 5,  active: true, hold: true }, // on hold: effective 25, counted at 25/2 = 12.5 -> 13
  ],
  sheets: [{ id: 'S9', people: [{ id: 1, name: 'Sol', alpha: 2, beta: 5, gamma: 2, active: true }] }],
  shares: [{ personId: 8, fromSheetId: 'S9', fromPersonId: 1 }],
  history: [{ personId: 3, field: 'beta', value: 30, from: '2026-04-01' }],
});
    await page.goto('/');

    await expect(page.getByTestId('person-row-1').getByTestId('concept-effective')).toHaveText('33');
    await expect(page.getByTestId('person-row-2').getByTestId('concept-effective')).toHaveText('4');
    await expect(page.getByTestId('person-row-3').getByTestId('concept-effective')).toHaveText('100');
    await expect(page.getByTestId('person-row-4').getByTestId('concept-effective')).toHaveText('5');

    await expect(page.getByTestId('rollup-active-count')).toHaveText('3'); // Dana, Uma, Sol (Hela is on hold)
    await expect(page.getByTestId('rollup-total-effective')).toHaveText('165'); // 33 + 4 + 100 + 5 + 10 (Sol) + 13 (Hela, on hold, at half)
  });
});
