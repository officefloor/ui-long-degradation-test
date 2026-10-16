import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// Sol is shared from sheet S9 as row 8: counted here like anyone (scaled 20, even).
// A change dated after the anchor does not count yet: Dot's beta 16 from 2026-04-01 (scaled 48, even).
// even scaled count: scaled 60, 240, 900 and Sol's 20 are even; Dot's 45 is odd -> 4 even.

test.describe('even scaled count', () => {
  test('counts people whose scaled is even', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
  anchor: '2026-03-01',
  people: [
    { id: 1, name: 'Ada', alpha: 2,  beta: 30, gamma: 2,  active: true }, // 60 even
    { id: 2, name: 'Ben', alpha: 4,  beta: 30, gamma: 4,  active: true }, // 240 even
    { id: 3, name: 'Cam', alpha: 10, beta: 30, gamma: 10, active: true }, // 900 even
    { id: 4, name: 'Dot', alpha: 3,  beta: 15, gamma: 3,  active: true }, // 45 odd
    // Hela is on hold: left out of every count (her scaled 2000 is even; with her the count would be 5)
    { id: 9, name: 'Hela', alpha: 10, beta: 50, gamma: 10, active: true, hold: true }, // 2000 even
  ],
  sheets: [
    { id: 'S9', people: [
      { id: 1, name: 'Sol', alpha: 2, beta: 10, gamma: 2, active: true }, // 20 even
    ] },
  ],
  shares: [{ personId: 8, fromSheetId: 'S9', fromPersonId: 1 }],
  history: [{ personId: 4, field: 'beta', value: 16, from: '2026-04-01' }],
});
    await page.goto('/');
    await expect(page.getByTestId('rollup-even-count')).toHaveText('4');

    // as of 2026-04-15 Dot's beta 16 counts: scaled 3 x 16 = 48, even -> 5
    await page.getByTestId('sheet-as-of').fill('2026-04-15');
    await page.getByTestId('sheet-as-of-apply').click();
    await expect(page.getByTestId('rollup-even-count')).toHaveText('5');
  });
});
