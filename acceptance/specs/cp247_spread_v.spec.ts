import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// The sheet multiplies band B by 4 (not 3), so Cam is 300 x 4 = 1200.
// Sol is shared from sheet S9 as row 8: counted here like anyone (mom20 -> band D x1 -> 20, the lowest).
// A change dated after the anchor does not count yet: Cam's beta 40 from 2026-04-01.
// scaled spread = highest scaled - lowest scaled = Cam 1200 - Sol 20 = 1180 (Hela, on hold, is left out).

test.describe('scaled spread', () => {
  test('spread is max scaled minus min scaled', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
  anchor: '2026-03-01',
  settings: { bandMultipliers: { A: 4, B: 4, C: 2, D: 1, E: 0 } },
  people: [
    { id: 1, name: 'Ada', alpha: 2,  beta: 30, gamma: 2,  active: true }, // 60
    { id: 2, name: 'Ben', alpha: 4,  beta: 30, gamma: 4,  active: true }, // 240
    { id: 3, name: 'Cam', alpha: 10, beta: 30, gamma: 10, active: true }, // 1200
    { id: 4, name: 'Dot', alpha: 3,  beta: 15, gamma: 3,  active: true }, // 45
    // Hela is on hold: left out of the highest and lowest (with her the spread would be 2000 - 20 = 1980)
    { id: 9, name: 'Hela', alpha: 10, beta: 50, gamma: 10, active: true, hold: true }, // 2000
  ],
  sheets: [
    { id: 'S9', people: [
      { id: 1, name: 'Sol', alpha: 2, beta: 10, gamma: 2, active: true }, // 20
    ] },
  ],
  shares: [{ personId: 8, fromSheetId: 'S9', fromPersonId: 1 }],
  history: [{ personId: 3, field: 'beta', value: 40, from: '2026-04-01' }],
});
    await page.goto('/');
    await expect(page.getByTestId('rollup-spread-v')).toHaveText('1180');
  });
});
