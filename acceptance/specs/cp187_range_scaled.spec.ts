import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

test.describe('range', () => {
  test('range is max minus min', { tag: '@functionality' }, async ({ page }) => {
    // Hela is on hold: left out of sheet-wide figures, counted at half in totals. Her scaled is
    // 3000 (thrust 600, drift 0, band A x5); counted, the range would be 3000 - 0.
    // the sheet's own band A multiplier is 5
    // Sol is shared from sheet S9: counted here like anyone (momentum 550, band A x5 -> value 2750, the highest:
    // range 2750 - Gwe's 0 = 2750)
    // a change dated after the anchor does not count yet (Ada's beta 70 from 2026-04-01)
    await resetAndSeed({
      anchor: '2026-03-01',
      settings: { bandMultipliers: { A: 5 } },
      sheets: [
        { id: 'S9', people: [{ id: 1, name: 'Sol', alpha: 10, beta: 55, gamma: 10, grade: 'MID', state: 'FINAL', active: true }] },
      ],
      shares: [{ personId: 8, fromSheetId: 'S9', fromPersonId: 1 }],
      history: [{ personId: 1, field: 'beta', value: 70, from: '2026-04-01' }],
      people: [
        { id: 1, name: 'Ada', alpha: 10, beta: 50, gamma: 10, grade: 'HIGH', state: 'FINAL', active: true },
        { id: 2, name: 'Ben', alpha: 10, beta: 30, gamma: 10, grade: 'MID', state: 'FINAL', active: true },
        { id: 3, name: 'Cam', alpha: 10, beta: 20, gamma: 10, grade: 'LOW', state: 'REVIEW', active: true },
        { id: 4, name: 'Dot', alpha: 4, beta: 30, gamma: 4, grade: 'HIGH', state: 'DRAFT', active: true },
        { id: 5, name: 'Eli', alpha: 8, beta: 10, gamma: 8, grade: 'MID', state: 'DRAFT', active: true },
        { id: 6, name: 'Fin', alpha: 2, beta: 30, gamma: 2, grade: 'LOW', state: 'REVIEW', active: true },
        { id: 7, name: 'Gwe', alpha: 5, beta: 1, gamma: 0, grade: 'HIGH', state: 'DRAFT', active: true },
        { id: 9, name: 'Hela', alpha: 10, beta: 60, gamma: 10, grade: 'HIGH', state: 'FINAL', active: true, hold: true },
      ],
    });
    await page.goto('/');
    await expect(page.getByTestId('rollup-range-scaled')).toHaveText('2750');
  });
});
