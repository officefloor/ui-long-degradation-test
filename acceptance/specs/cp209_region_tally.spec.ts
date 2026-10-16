import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

test.describe('region tally', () => {
  test('counts per region', { tag: '@functionality' }, async ({ page }) => {
    // Hela is on hold: she still shows on the list, but is left out of sheet-wide figures (counted at half in totals).
    // Sol is shared from sheet S9, where she is in region S2: counted here like anyone (momentum 30).
    // S2 holds Cam, Dot and Sol; Hela is in S2 but on hold, so she is not counted -> 3.
    // N1 (Ada) and N2 (Ben) are different regions though they share a first letter: 1 each.
    await resetAndSeed({
      sheets: [
        { id: 'S9', people: [
          { id: 1, name: 'Sol', alpha: 3, beta: 10, gamma: 3, grade: 'LOW', state: 'DRAFT', active: true },
        ], regions: [{ personId: 1, region: 'S2' }] },
      ],
      shares: [{ personId: 8, fromSheetId: 'S9', fromPersonId: 1 }],
      people: [
        { id: 1, name: 'Ada', alpha: 10, beta: 50, gamma: 10, grade: 'HIGH', state: 'FINAL', active: true },
        { id: 2, name: 'Ben', alpha: 10, beta: 30, gamma: 10, grade: 'MID', state: 'FINAL', active: true },
        { id: 3, name: 'Cam', alpha: 10, beta: 20, gamma: 10, grade: 'LOW', state: 'REVIEW', active: true },
        { id: 4, name: 'Dot', alpha: 4, beta: 30, gamma: 4, grade: 'HIGH', state: 'DRAFT', active: true },
        { id: 5, name: 'Eli', alpha: 8, beta: 10, gamma: 8, grade: 'MID', state: 'DRAFT', active: true },
        { id: 6, name: 'Fin', alpha: 2, beta: 30, gamma: 2, grade: 'LOW', state: 'REVIEW', active: true },
        { id: 7, name: 'Gwe', alpha: 5, beta: 1, gamma: 0, grade: 'HIGH', state: 'DRAFT', active: true },
        { id: 9, name: 'Hela', alpha: 1, beta: 251, gamma: 1, grade: 'LOW', state: 'DRAFT', active: true, hold: true }, // momentum 251 -> band B x3 -> scaled 753, half 376
      ],
      regions: [
        { personId: 1, region: 'N1' },
        { personId: 2, region: 'N2' },
        { personId: 3, region: 'S2' },
        { personId: 4, region: 'S2' },
        { personId: 5, region: 'E3' },
        { personId: 6, region: 'E3' },
        { personId: 7, region: 'E3' },
        { personId: 9, region: 'S2' },
      ],
    });
    await page.goto('/');
    await expect(page.getByTestId('region-tally-N1')).toHaveText('1');
    await expect(page.getByTestId('region-tally-N2')).toHaveText('1');
    await expect(page.getByTestId('region-tally-S2')).toHaveText('3');
    await expect(page.getByTestId('region-tally-E3')).toHaveText('3');
  });
});
