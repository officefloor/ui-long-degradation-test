import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

test.describe('ledger by tier', () => {
  test('sums scaled per tier', { tag: '@functionality' }, async ({ page }) => {
    // Hela is on hold: she still shows on the list and is left out of the counts, but a total split by
    // tier counts her at her full value.
    // The sheet's own band multiplier for D is 2 (default 1): Eli 80 x 2 = 160, Fin 60 x 2 = 120, Sol 30 x 2 = 60.
    // Sol is shared from sheet S9: counted here like anyone (momentum 30, STEADY, band D -> 60).
    // A change dated after the anchor does not count yet (Ada's beta 10 from 2026-04-01).
    // SURGE: Ada 2000 + Ben 900 + Cam 400 + Hela 753 = 4053 (at half it would be 3677);
    // STEADY: Dot 240 + Eli 160 + Fin 120 + Sol 60 = 580; SINK: Gwe 0.
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
        { id: 9, name: 'Hela', alpha: 1, beta: 251, gamma: 1, grade: 'LOW', state: 'DRAFT', active: true, hold: true }, // momentum 251 -> band B x3 -> scaled 753, in full
      ],
    });
    await page.goto('/');
    await expect(page.getByTestId('tier-ledger-SURGE')).toHaveText('4053');
    await expect(page.getByTestId('tier-ledger-STEADY')).toHaveText('580');
    await expect(page.getByTestId('tier-ledger-SINK')).toHaveText('0');
    // the count still leaves her out: Ada, Ben, Cam (4 if she were counted)
    await expect(page.getByTestId('tier-tally-SURGE')).toHaveText('3');

    // as of 2026-04-01 Ada's change counts: momentum 100 (STEADY), so SURGE = 900 + 400 + 753 = 2053
    await page.getByTestId('sheet-as-of').fill('2026-04-01');
    await page.getByTestId('sheet-as-of-apply').click();
    await expect(page.getByTestId('tier-ledger-SURGE')).toHaveText('2053');
  });
});
