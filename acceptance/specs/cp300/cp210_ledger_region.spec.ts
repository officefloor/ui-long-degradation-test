import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

test.describe('ledger by region', () => {
  test('sums scaled per region', { tag: '@functionality' }, async ({ page }) => {
    // Hela is on hold: she still shows on the list and is left out of the counts, but a total split by
    // region counts her at her full value.
    // This sheet sets band B's multiplier to 4 (A 4, C 2, D 1, E 0 as usual).
    // Sol is shared from sheet S9 as row 8, in region E3: counted here like anyone (momentum 50,
    // band D, scaled 50).
    // A change dated after the anchor does not count yet: Fin's beta 50 from 2026-04-01.
    // N1 = 2000 + 1200 = 3200; S2 = 400 + 240 + Hela's 1004 = 1644 (at half it would be 1142);
    // E3 = 80 + 60 + 0 + 50 = 190.
    await resetAndSeed({
      anchor: '2026-03-01',
      settings: { bandMultipliers: { A: 4, B: 4, C: 2, D: 1, E: 0 } },
      people: [
        { id: 1, name: 'Ada', alpha: 10, beta: 50, gamma: 10, grade: 'HIGH', state: 'FINAL', active: true },
        { id: 2, name: 'Ben', alpha: 10, beta: 30, gamma: 10, grade: 'MID', state: 'FINAL', active: true },
        { id: 3, name: 'Cam', alpha: 10, beta: 20, gamma: 10, grade: 'LOW', state: 'REVIEW', active: true },
        { id: 4, name: 'Dot', alpha: 4, beta: 30, gamma: 4, grade: 'HIGH', state: 'DRAFT', active: true },
        { id: 5, name: 'Eli', alpha: 8, beta: 10, gamma: 8, grade: 'MID', state: 'DRAFT', active: true },
        { id: 6, name: 'Fin', alpha: 2, beta: 30, gamma: 2, grade: 'LOW', state: 'REVIEW', active: true },
        { id: 7, name: 'Gwe', alpha: 5, beta: 1, gamma: 0, grade: 'HIGH', state: 'DRAFT', active: true },
        { id: 9, name: 'Hela', alpha: 1, beta: 251, gamma: 1, grade: 'LOW', state: 'DRAFT', active: true, hold: true }, // momentum 251 -> band B x4 -> scaled 1004, counted in full
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
      sheets: [
        { id: 'S9', people: [
          { id: 1, name: 'Sol', alpha: 5, beta: 10, gamma: 5, grade: 'LOW', state: 'REVIEW', active: true },
        ], regions: [{ personId: 1, region: 'E3' }] },
      ],
      shares: [{ personId: 8, fromSheetId: 'S9', fromPersonId: 1 }],
      history: [{ personId: 6, field: 'beta', value: 50, from: '2026-04-01' }],
    });
    await page.goto('/');
    // ledger-region-N1: Ada 2000 + Ben 1200 = 3200; leave out the highest contribution, Ada's 2000 -> 1200
    await expect(page.getByTestId('ledger-region-N1')).toHaveText('1200');
    // ledger-region-S2: Cam 400 + Dot 240 + Hela 1004 (in full) = 1644; leave out the highest contribution, Hela's 1004 -> 640
    await expect(page.getByTestId('ledger-region-S2')).toHaveText('640');
    // ledger-region-E3: Eli 80 + Fin 60 + Gwe 0 + Sol 50 = 190; leave out the highest contribution, Eli's 80 -> 110
    await expect(page.getByTestId('ledger-region-E3')).toHaveText('110');
    // the count still leaves her out: Cam and Dot (3 if she were counted)
    await expect(page.getByTestId('region-tally-S2')).toHaveText('2');
  });
});
