import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// grand influence = everyone's influence added together, a total like any other (a held person at
// half, to the nearest; negatives as zero; the highest contribution left out). With no patrons,
// influence = effective = momentum.
//   Ada 60, Ben 120, Cam 300, Dot 45
//   Eli alpha missing counts as 0: thrust 0, drift 5, momentum 15 -> influence 15
//   Sol is shared from sheet S9 as row 8: counted here like anyone, influence 100
//   Hela (on hold) influence 45, counted at half: 22.5 -> 23
//   60 + 120 + 300 + 45 + 15 + 100 + 23 = 663; the highest (Cam's 300) left out -> 363
// A change dated after the anchor does not count yet: Dot's beta 30 from 2026-04-01 (influence 90).

test.describe('grand influence', () => {
  test('sums every influence', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
  anchor: '2026-03-01',
  people: [
    { id: 1, name: 'Ada', alpha: 2,  beta: 30, gamma: 2,  active: true },
    { id: 2, name: 'Ben', alpha: 4,  beta: 30, gamma: 4,  active: true },
    { id: 3, name: 'Cam', alpha: 10, beta: 30, gamma: 10, active: true },
    { id: 4, name: 'Dot', alpha: 3,  beta: 15, gamma: 3,  active: true },
    { id: 5, name: 'Eli', alpha: null, beta: 30, gamma: 5, active: true }, // alpha missing -> influence 15
    // Hela is on hold: counted at half in the grand influence
    { id: 9, name: 'Hela', alpha: 5, beta: 9, gamma: 5, active: true, hold: true }, // influence 45, counts 23
  ],
  sheets: [
    { id: 'S9', people: [
      { id: 1, name: 'Sol', alpha: 4, beta: 25, gamma: 4, active: true }, // influence 100
    ] },
  ],
  shares: [{ personId: 8, fromSheetId: 'S9', fromPersonId: 1 }],
  history: [{ personId: 4, field: 'beta', value: 30, from: '2026-04-01' }],
});
    await page.goto('/');
    await expect(page.getByTestId('person-row-5').getByTestId('concept-influence')).toHaveText('15');
    await expect(page.getByTestId('rollup-grand-influence')).toHaveText('363');

    // as of 2026-04-15 Dot's beta 30 counts: influence 90, so 663 - 45 + 90 = 708 -> 408
    await page.getByTestId('sheet-as-of').fill('2026-04-15');
    await page.getByTestId('sheet-as-of-apply').click();
    await expect(page.getByTestId('rollup-grand-influence')).toHaveText('408');
  });
});
