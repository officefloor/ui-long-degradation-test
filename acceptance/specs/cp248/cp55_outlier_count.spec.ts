import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// Sol is shared from sheet S9 as row 8: counted here like anyone (scaled 900).
// mean floor = (40 + 60 + 80 + 240 + 900 + 900) / 6 = 2220 / 6 = 370; norms -330, -310, -290, -130,
// 530 and Sol 530 are all more than 100 from zero -> 6 outliers

test.describe('outlier count', () => {
  test('counts the outliers on the sheet', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
  people: [
    { id: 1, name: 'Fay', alpha: 5,  beta: 8,  gamma: 5,  active: true },
    { id: 2, name: 'Gus', alpha: 2,  beta: 30, gamma: 2,  active: true },
    { id: 3, name: 'Hal', alpha: 8,  beta: 10, gamma: 8,  active: true },
    { id: 4, name: 'Ivy', alpha: 4,  beta: 30, gamma: 4,  active: true },
    { id: 5, name: 'Jo',  alpha: 10, beta: 30, gamma: 10, active: true },
    // Hela is on hold: left out of the average and the outlier count; her own norm is 2000 - 370 = 1630
    { id: 9, name: 'Hela', alpha: 10, beta: 50, gamma: 10, active: true, hold: true }, // 2000
  ],
  sheets: [
    { id: 'S9', people: [
      { id: 1, name: 'Sol', alpha: 10, beta: 30, gamma: 10, active: true }, // 900
    ] },
  ],
  shares: [{ personId: 8, fromSheetId: 'S9', fromPersonId: 1 }],
});
    await page.goto('/');
    await expect(page.getByTestId('rollup-outlier-count')).toHaveText('6');
  });
});
