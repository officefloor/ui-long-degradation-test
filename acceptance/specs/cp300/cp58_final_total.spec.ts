import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// final total rollup: the sum of scaled over only the people whose state is FINAL.
// This sheet sets band C's multiplier to 3 (A 4, B 3, D 1, E 0 as usual).
//   Al mom100 -> scaled 300 (FINAL), Bea mom300 -> scaled 900 (FINAL), Cal mom60 -> scaled 60 (DRAFT, excluded)
//   final total = 300 + 900 = 1200
// Hela is on hold: momentum 100 -> scaled 300 (FINAL), counted at half (150) in the total.
// Sol is shared from sheet S9 as row 8, FINAL here: counted like anyone (momentum 20, scaled 20).
// A change dated after the anchor does not count yet: Al's beta 40 from 2026-04-01.

test.describe('final total', () => {
  test('final total sums scaled of FINAL people only', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
  anchor: '2026-03-01',
  settings: { bandMultipliers: { A: 4, B: 3, C: 3, D: 1, E: 0 } },
  people: [
    { id: 1, name: 'Al',  alpha: 5,  beta: 20, gamma: 5,  active: true, state: 'FINAL' },
    { id: 2, name: 'Bea', alpha: 10, beta: 30, gamma: 10, active: true, state: 'FINAL' },
    { id: 3, name: 'Cal', alpha: 2,  beta: 30, gamma: 2,  active: true, state: 'DRAFT' },
    { id: 9, name: 'Hela', alpha: 10, beta: 10, gamma: 10, active: true, state: 'FINAL', hold: true },
  ],
  sheets: [
    { id: 'S9', people: [
      { id: 1, name: 'Sol', alpha: 2, beta: 10, gamma: 2, active: true, state: 'FINAL' },
    ] },
  ],
  shares: [{ personId: 8, fromSheetId: 'S9', fromPersonId: 1, state: 'FINAL' }],
  history: [{ personId: 1, field: 'beta', value: 40, from: '2026-04-01' }],
});
    await page.goto('/');

    // rollup-final-total: Al 300 + Bea 900 + Hela 150 (half of 300) + Sol 20 = 1370; leave out the highest contribution, Bea's 900 -> 470
    await expect(page.getByTestId('rollup-final-total')).toHaveText('470');
  });
});
