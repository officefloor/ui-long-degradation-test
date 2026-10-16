import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

test.describe('ledger total', () => {
  test('ledger sums all scaled', { tag: '@functionality' }, async ({ page }) => {
    // Hela is on hold: left out of sheet-wide figures, counted at half in totals. Her scaled is
    // 3000 (thrust 600, drift 0, band A x5).
    // Ledger = 2500 + 900 + 400 + 240 + 80 + 60 + 0 + Sol 1200 = 5380, plus floor(3000 / 2) = 1500
    // => 6880.
    // the sheet's own band A multiplier is 5: Ada's value is 500*5 = 2500
    // Sol is shared from sheet S9: counted here like anyone (momentum 400, band B x3 -> value 1200)
    // a change dated after the anchor does not count yet (Ada's beta 60 from 2026-04-01); Ben's beta was 45 until it became 30 on 2026-02-01
    await resetAndSeed({
      anchor: '2026-03-01',
      settings: { bandMultipliers: { A: 5 } },
      sheets: [
        { id: 'S9', people: [{ id: 1, name: 'Sol', alpha: 10, beta: 40, gamma: 10, grade: 'MID', state: 'FINAL', active: true }] },
      ],
      shares: [{ personId: 8, fromSheetId: 'S9', fromPersonId: 1 }],
      history: [
        { personId: 1, field: 'beta', value: 60, from: '2026-04-01' },
        { personId: 2, field: 'beta', value: 30, from: '2026-02-01' },
      ],
      people: [
        { id: 1, name: 'Ada', alpha: 10, beta: 50, gamma: 10, grade: 'HIGH', state: 'FINAL', active: true },
        { id: 2, name: 'Ben', alpha: 10, beta: 45, gamma: 10, grade: 'MID', state: 'FINAL', active: true },
        { id: 3, name: 'Cam', alpha: 10, beta: 20, gamma: 10, grade: 'LOW', state: 'REVIEW', active: true },
        { id: 4, name: 'Dot', alpha: 4, beta: 30, gamma: 4, grade: 'HIGH', state: 'DRAFT', active: true },
        { id: 5, name: 'Eli', alpha: 8, beta: 10, gamma: 8, grade: 'MID', state: 'DRAFT', active: true },
        { id: 6, name: 'Fin', alpha: 2, beta: 30, gamma: 2, grade: 'LOW', state: 'REVIEW', active: true },
        { id: 7, name: 'Gwe', alpha: 5, beta: 1, gamma: 0, grade: 'HIGH', state: 'DRAFT', active: true },
        { id: 9, name: 'Hela', alpha: 10, beta: 60, gamma: 10, grade: 'HIGH', state: 'FINAL', active: true, hold: true },
      ],
    });
    await page.goto('/');
    await expect(page.getByTestId('rollup-ledger')).toHaveText('6880');

    // as of 2026-01-15 Ben's beta is still 45: value 1350 instead of 900, ledger 6880 + 450 = 7330
    await page.getByTestId('sheet-as-of').fill('2026-01-15');
    await page.getByTestId('sheet-as-of-apply').click();
    await expect(page.getByTestId('rollup-ledger')).toHaveText('7330');
  });
});
