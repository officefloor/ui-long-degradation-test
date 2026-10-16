import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// grand sum = grand scaled + grand influence, each a total that counts a held person at half and
// leaves out its own highest contribution. With no patrons, influence = momentum.
// The sheet multiplies band C by 3 (not 2). Sol is shared from sheet S9 as row 8: counted here like
// anyone (momentum 100, scaled 300, influence 100). A change dated after the anchor does not count
// yet: Dot's beta 30 from 2026-04-01 (momentum 90, scaled 90, influence 90).
//   scaled:    Ada 60, Ben 360, Cam 900, Dot 45, Eli 15 (alpha missing counts as 0: momentum 15),
//              Sol 300, Hela (on hold) 2000 at half = 1000 -> 2680, the highest (Hela's 1000) left
//              out -> 1680
//   influence: Ada 60, Ben 120, Cam 300, Dot 45, Eli 15, Sol 100, Hela 500 at half = 250 -> 890, the
//              highest (Cam's 300) left out -> 590
//   grand sum 1680 + 590 = 2270

test.describe('grand sum', () => {
  test('grand sum is grand scaled plus grand influence', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
  anchor: '2026-03-01',
  settings: { bandMultipliers: { A: 4, B: 3, C: 3, D: 1, E: 0 } },
  people: [
    { id: 1, name: 'Ada', alpha: 2,  beta: 30, gamma: 2,  active: true },
    { id: 2, name: 'Ben', alpha: 4,  beta: 30, gamma: 4,  active: true },
    { id: 3, name: 'Cam', alpha: 10, beta: 30, gamma: 10, active: true },
    { id: 4, name: 'Dot', alpha: 3,  beta: 15, gamma: 3,  active: true },
    { id: 5, name: 'Eli', alpha: null, beta: 30, gamma: 5, active: true }, // alpha missing -> scaled 15, influence 15
    // Hela is on hold: counted at half in both grand sums
    { id: 9, name: 'Hela', alpha: 10, beta: 50, gamma: 10, active: true, hold: true }, // scaled 2000 counts 1000, influence 500 counts 250
  ],
  sheets: [
    { id: 'S9', people: [
      { id: 1, name: 'Sol', alpha: 4, beta: 25, gamma: 4, active: true }, // scaled 300, influence 100
    ] },
  ],
  shares: [{ personId: 8, fromSheetId: 'S9', fromPersonId: 1 }],
  history: [{ personId: 4, field: 'beta', value: 30, from: '2026-04-01' }],
});
    await page.goto('/');
    await expect(page.getByTestId('person-row-5').getByTestId('concept-scaled')).toHaveText('15');
    await expect(page.getByTestId('rollup-grand-sum')).toHaveText('2240');

    // as of 2026-04-15 Dot's beta 30 counts: scaled 1680 - 45 + 90 = 1725, influence 590 - 45 + 90 =
    // 635 -> 2360
    await page.getByTestId('sheet-as-of').fill('2026-04-15');
    await page.getByTestId('sheet-as-of-apply').click();
    await expect(page.getByTestId('rollup-grand-sum')).toHaveText('2330');
  });
});
