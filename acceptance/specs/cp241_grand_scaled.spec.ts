import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// Whole-stack sweep: grand scaled = everyone's scaled added together, a total like any other (a held
// person at half, to the nearest; negatives as zero; the highest contribution left out). Bare roster
// (active, no patrons/allies/score), so adjusted = momentum and scaled = momentum * band multiplier.
// The sheet multiplies band C by 3 (not 2).
//   Ada mom60 D x1 =60, Ben 120 C x3 =360, Cam 300 B x3 =900, Dot 45 D x1 =45
//   Eli alpha missing counts as 0: thrust 0, drift 5, momentum 15, D x1 = 15
//   Sol is shared from sheet S9 as row 8: counted here like anyone, mom100 C x3 = 300
//   Hela (on hold) mom45 D x1 = 45, counted at half: 22.5 -> 23
//   60 + 360 + 900 + 45 + 15 + 300 + 23 = 1703; the highest (Cam's 900) left out -> 803
// A change dated after the anchor does not count yet: Dot's beta 30 from 2026-04-01 (mom90, scaled 90).

test.describe('grand scaled', () => {
  test('sums every scaled', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
  anchor: '2026-03-01',
  settings: { bandMultipliers: { A: 4, B: 3, C: 3, D: 1, E: 0 } },
  people: [
    { id: 1, name: 'Ada', alpha: 2,  beta: 30, gamma: 2,  active: true }, // scaled 60
    { id: 2, name: 'Ben', alpha: 4,  beta: 30, gamma: 4,  active: true }, // scaled 360
    { id: 3, name: 'Cam', alpha: 10, beta: 30, gamma: 10, active: true }, // scaled 900
    { id: 4, name: 'Dot', alpha: 3,  beta: 15, gamma: 3,  active: true }, // scaled 45
    { id: 5, name: 'Eli', alpha: null, beta: 30, gamma: 5, active: true }, // alpha missing -> scaled 15
    // Hela is on hold: counted at half in the grand scaled
    { id: 9, name: 'Hela', alpha: 5, beta: 9, gamma: 5, active: true, hold: true }, // scaled 45, counts 23
  ],
  sheets: [
    { id: 'S9', people: [
      { id: 1, name: 'Sol', alpha: 4, beta: 25, gamma: 4, active: true }, // scaled 300
    ] },
  ],
  shares: [{ personId: 8, fromSheetId: 'S9', fromPersonId: 1 }],
  history: [{ personId: 4, field: 'beta', value: 30, from: '2026-04-01' }],
});
    await page.goto('/');
    await expect(page.getByTestId('person-row-5').getByTestId('concept-scaled')).toHaveText('15');
    await expect(page.getByTestId('rollup-grand-scaled')).toHaveText('803');

    // as of 2026-04-15 Dot's beta 30 counts: scaled 90, so 1703 - 45 + 90 = 1748 -> 848
    await page.getByTestId('sheet-as-of').fill('2026-04-15');
    await page.getByTestId('sheet-as-of-apply').click();
    await expect(page.getByTestId('rollup-grand-scaled')).toHaveText('848');
  });
});
