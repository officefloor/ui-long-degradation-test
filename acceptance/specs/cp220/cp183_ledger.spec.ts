import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

test.describe('ledger total', () => {
  test('ledger sums all scaled', { tag: '@functionality' }, async ({ page }) => {
    // This sheet sets band A's multiplier to 5 (B 3, C 2, D 1, E 0 as usual): Ada 500 x5 = 2500.
    // Hela is on hold: left out of sheet-wide figures, counted at half in totals. Her scaled is
    // 3000 (thrust 600, drift 0, band A x5).
    // Sol is shared from sheet S9 as row 8: counted here like anyone. Momentum 50, band D, scaled 50.
    // A change dated after the anchor does not count yet: Ben's beta 40 from 2026-04-01.
    await resetAndSeed({
      anchor: '2026-03-01',
      settings: { bandMultipliers: { A: 5, B: 3, C: 2, D: 1, E: 0 } },
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
      sheets: [
        { id: 'S9', people: [
          { id: 1, name: 'Sol', alpha: 5, beta: 10, gamma: 5, grade: 'LOW', state: 'REVIEW', active: true },
        ] },
      ],
      shares: [{ personId: 8, fromSheetId: 'S9', fromPersonId: 1 }],
      history: [{ personId: 2, field: 'beta', value: 40, from: '2026-04-01' }],
    });
    await page.goto('/');
    // rollup-ledger: Ada 2500 + Ben 900 + Cam 400 + Dot 240 + Eli 80 + Fin 60 + Gwe 0 + Hela 1500 (half of 3000) + Sol 50 = 5730; leave out the highest contribution, Ada's 2500 -> 3230
    await expect(page.getByTestId('rollup-ledger')).toHaveText('3230');

    // as of 2026-05-01 Ben's beta 40 counts: momentum 400, band B, scaled 1200;
    // 5730 - 900 + 1200 = 6030, Ada's 2500 left out -> 3530
    await page.getByTestId('sheet-as-of').fill('2026-05-01');
    await page.getByTestId('sheet-as-of-apply').click();
    await expect(page.getByTestId('rollup-ledger')).toHaveText('3530');
  });
});
