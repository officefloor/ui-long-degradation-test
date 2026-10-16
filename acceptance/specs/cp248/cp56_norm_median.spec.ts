import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// against the MEAN again, so norms, outliers and the count return to their mean-based values.
// (This checkpoint's name predates the reversal.)
// The sheet multiplies band C by 3 (not 2), so Ivy is 120 x 3 = 360.
// Sol is shared from sheet S9 as row 8: counted here like anyone (scaled 900).
// A change dated after the anchor does not count yet: Hal's beta 20 from 2026-04-01 (scaled 480).
// mean floor = (40 + 60 + 80 + 360 + 900 + 900) / 6 = 2340 / 6 = 390; Sol is an outlier too -> count 5

test.describe('norm against the median', () => {
  test('norm, outliers and count use the mean again', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
  anchor: '2026-03-01',
  settings: { bandMultipliers: { A: 4, B: 3, C: 3, D: 1, E: 0 } },
  people: [
    { id: 1, name: 'Fay', alpha: 5,  beta: 8,  gamma: 5,  active: true }, // 40
    { id: 2, name: 'Gus', alpha: 2,  beta: 30, gamma: 2,  active: true }, // 60
    { id: 3, name: 'Hal', alpha: 8,  beta: 10, gamma: 8,  active: true }, // 80
    { id: 4, name: 'Ivy', alpha: 4,  beta: 30, gamma: 4,  active: true }, // 360
    { id: 5, name: 'Jo',  alpha: 10, beta: 30, gamma: 10, active: true }, // 900
    // Hela is on hold: left out of the average and the outlier count; her own norm is 2000 - 390 = 1610
    { id: 9, name: 'Hela', alpha: 10, beta: 50, gamma: 10, active: true, hold: true }, // 2000
  ],
  sheets: [
    { id: 'S9', people: [
      { id: 1, name: 'Sol', alpha: 10, beta: 30, gamma: 10, active: true }, // 900
    ] },
  ],
  shares: [{ personId: 8, fromSheetId: 'S9', fromPersonId: 1 }],
  history: [{ personId: 3, field: 'beta', value: 20, from: '2026-04-01' }],
});
    await page.goto('/');

    await expect(page.getByTestId('person-row-1').getByTestId('concept-norm')).toHaveText('-350');
    await expect(page.getByTestId('person-row-2').getByTestId('concept-norm')).toHaveText('-330');
    await expect(page.getByTestId('person-row-3').getByTestId('concept-norm')).toHaveText('-310');
    await expect(page.getByTestId('person-row-4').getByTestId('concept-norm')).toHaveText('-30');
    await expect(page.getByTestId('person-row-5').getByTestId('concept-norm')).toHaveText('510');

    await expect(page.getByTestId('person-row-4').getByTestId('concept-outlier')).toHaveText('no');
    await expect(page.getByTestId('person-row-5').getByTestId('concept-outlier')).toHaveText('yes');
    await expect(page.getByTestId('rollup-outlier-count')).toHaveText('5');
  });
});
