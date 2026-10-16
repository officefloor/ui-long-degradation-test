import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

test.describe('ledger by region', () => {
  test('sums scaled per region', { tag: '@functionality' }, async ({ page }) => {
    // Hela is on hold: she still shows on the list, but is left out of sheet-wide figures, counted at half in totals.
    // The sheet's own band multiplier for D is 2 (default 1): Eli 80 x 2 = 160, Fin 60 x 2 = 120.
    // Sol is shared from sheet S9, where she is in region E3: counted here like anyone (momentum 30, band D -> 60).
    // A change dated after the anchor does not count yet (Ada's beta 10 from 2026-04-01).
    // N1 = 2000 + 900 = 2900; S2 = 400 + 240 + Hela's half 753 / 2 = 376.5 -> 377 (nearest, a half
    // rounding up) -> 1017; E3 = 160 + 120 + 0 + 60 = 340.
    await resetAndSeed({
      anchor: '2026-03-01',
      settings: { bandMultipliers: { A: 4, B: 3, C: 2, D: 2, E: 0 } },
      sheets: [
        { id: 'S9', people: [
          { id: 1, name: 'Sol', alpha: 3, beta: 10, gamma: 3, grade: 'LOW', state: 'DRAFT', active: true },
        ], regions: [{ personId: 1, region: 'E3' }] },
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
        { id: 9, name: 'Hela', alpha: 1, beta: 251, gamma: 1, grade: 'LOW', state: 'DRAFT', active: true, hold: true }, // momentum 251 -> band B x3 -> scaled 753, half 377
      ],
      regions: [
        { personId: 1, region: 'N1' },
        { personId: 2, region: 'N1' },
        { personId: 3, region: 'S2' },
        { personId: 4, region: 'S2' },
        { personId: 5, region: 'E3' },
        { personId: 6, region: 'E3' },
        { personId: 7, region: 'E3' },
        { personId: 9, region: 'S2' },
      ],
    });
    await page.goto('/');
    await expect(page.getByTestId('ledger-region-N1')).toHaveText('2900');
    await expect(page.getByTestId('ledger-region-S2')).toHaveText('1017');
    await expect(page.getByTestId('ledger-region-E3')).toHaveText('340');

    // as of 2026-04-01 Ada's change counts: momentum 100, band C -> 200; N1 = 200 + 900 = 1100
    await page.getByTestId('sheet-as-of').fill('2026-04-01');
    await page.getByTestId('sheet-as-of-apply').click();
    await expect(page.getByTestId('ledger-region-N1')).toHaveText('1100');
  });
});
