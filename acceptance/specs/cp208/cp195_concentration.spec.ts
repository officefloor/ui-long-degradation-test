import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

test.describe('concentration', () => {
  test('top two share percent', { tag: '@functionality' }, async ({ page }) => {
    // A percentage is taken over the people who count (not on hold, momentum not 0). Hela is on
    // hold: her scaled 240 (thrust 120, drift 0, band C x2) adds nothing to the whole.
    // The sheet's own band multiplier for D is 2 (default 1): Eli 80 x 2 = 160, Fin 60 x 2 = 120, Sol 30 x 2 = 60.
    // Sol is shared from sheet S9: counted here like anyone (alpha 3, beta 10: momentum 30, band D).
    // A change dated after the anchor does not count yet (Ada's beta 10 from 2026-04-01).
    // Whole = 2000 + 900 + 400 + 240 + 160 + 120 + 60 + 0 = 3880; top two 2000 + 900 = 2900;
    // 2900 * 100 / 3880 = 74.7 => 74 (72 with her half in the whole, 70 counted in full).
    await resetAndSeed({
      anchor: '2026-03-01',
      settings: { bandMultipliers: { A: 4, B: 3, C: 2, D: 2, E: 0 } },
      sheets: [
        { id: 'S9', people: [
          { id: 1, name: 'Sol', alpha: 3, beta: 10, gamma: 3, grade: 'LOW', state: 'DRAFT', active: true },
        ] },
      ],
      shares: [{ personId: 8, fromSheetId: 'S9', fromPersonId: 1 }],
      history: [{ personId: 1, field: 'beta', value: 10, from: '2026-04-01' }],
      people: [
        { id: 1, name: 'Ada', alpha: 10, beta: 50, gamma: 10, grade: 'HIGH', state: 'FINAL', active: true },
        { id: 2, name: 'Ben', alpha: 10, beta: 30, gamma: 10, grade: 'MID', state: 'FINAL', active: true },
        { id: 3, name: 'Cam', alpha: 10, beta: 20, gamma: 10, grade: 'LOW', state: 'REVIEW', active: true },
        { id: 4, name: 'Dot', alpha: 4, beta: 30, gamma: 4, grade: 'HIGH', state: 'DRAFT', active: true },
        { id: 5, name: 'Eli', alpha: 8, beta: 10, gamma: 8, grade: 'MID', state: 'DRAFT', active: true },
        { id: 6, name: 'Fin', alpha: 2, beta: 30, gamma: 2, grade: 'LOW', state: 'REVIEW', active: true },
        { id: 7, name: 'Gwe', alpha: 5, beta: 1, gamma: 0, grade: 'HIGH', state: 'DRAFT', active: true },
        { id: 9, name: 'Hela', alpha: 4, beta: 30, gamma: 4, grade: 'HIGH', state: 'FINAL', active: true, hold: true },
      ],
    });
    await page.goto('/');
    await expect(page.getByTestId('rollup-concentration')).toHaveText('74');
  });
});
