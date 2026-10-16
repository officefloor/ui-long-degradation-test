import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

test.describe('report screen', () => {
  test('report screen re-reads figures', { tag: '@core' }, async ({ page }) => {
    // The sheet multiplies band C by 3 (not 2): Cam 200 x 3 = 600, Dot 120 x 3 = 360.
    // Sol is shared from sheet S9 as row 8: counted here like anyone (momentum 100, band C x3 -> 300).
    // A change dated after the anchor does not count yet: Eli's beta 40 from 2026-04-01.
    await resetAndSeed({
      anchor: '2026-03-01',
      settings: { bandMultipliers: { A: 4, B: 3, C: 3, D: 1, E: 0 } },
      people: [
        { id: 1, name: 'Ada', alpha: 10, beta: 50, gamma: 10, grade: 'HIGH', state: 'FINAL', active: true },
        { id: 2, name: 'Ben', alpha: 10, beta: 30, gamma: 10, grade: 'MID', state: 'FINAL', active: true },
        { id: 3, name: 'Cam', alpha: 10, beta: 20, gamma: 10, grade: 'LOW', state: 'REVIEW', active: true },
        { id: 4, name: 'Dot', alpha: 4, beta: 30, gamma: 4, grade: 'HIGH', state: 'DRAFT', active: true },
        { id: 5, name: 'Eli', alpha: 8, beta: 10, gamma: 8, grade: 'MID', state: 'DRAFT', active: true },
        { id: 6, name: 'Fin', alpha: 2, beta: 30, gamma: 2, grade: 'LOW', state: 'REVIEW', active: true },
        { id: 7, name: 'Gwe', alpha: 5, beta: 1, gamma: 0, grade: 'HIGH', state: 'DRAFT', active: true },
        // Hela is on hold (momentum 600, scaled 2400): left out of counts and top names, totals count her at half
        { id: 9, name: 'Hela', alpha: 10, beta: 60, gamma: 10, grade: 'HIGH', state: 'FINAL', active: true, hold: true },
      ],
      sheets: [
        { id: 'S9', people: [
          { id: 1, name: 'Sol', alpha: 5, beta: 20, gamma: 5, grade: 'LOW', state: 'REVIEW', active: true },
        ] },
      ],
      shares: [{ personId: 8, fromSheetId: 'S9', fromPersonId: 1, state: 'REVIEW' }],
      history: [{ personId: 5, field: 'beta', value: 40, from: '2026-04-01' }],
    });
    await page.goto('/');
    // values 2000, 900, 600, 360, 80, 60, 0, Sol 300 and Hela's half 1200: 5500, the highest (2000) left out
    await expect(page.getByTestId('report-ledger')).toHaveText('3500');
    await expect(page.getByTestId('report-headcount')).toHaveText('7'); // Hela is not counted, Sol is
  });
});
