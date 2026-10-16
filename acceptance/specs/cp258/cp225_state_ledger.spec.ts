import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

test.describe('ledger by state', () => {
  test('sums scaled per state', { tag: '@functionality' }, async ({ page }) => {
    // Each state's total leaves out its own highest contribution. Hela is on hold: she still shows on
    // the list and is left out of the counts, but a total split by state counts her in full.
    // The sheet multiplies band C by 3 (not 2): Cam 200 x 3 = 600, Dot 120 x 3 = 360.
    // Sol is shared from sheet S9 as row 8: counted here like anyone (momentum 100, band C x3 -> 300, REVIEW here).
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
        { id: 9, name: 'Hela', alpha: 1, beta: 251, gamma: 1, grade: 'MID', state: 'DRAFT', active: true, hold: true }, // momentum 251 -> band B x3 -> scaled 753
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
    // state-ledger-FINAL: Ada 2000 + Ben 900 = 2900; leave out the highest contribution, Ada's 2000 -> 900
    await expect(page.getByTestId('state-ledger-FINAL')).toHaveText('0');
    // state-ledger-REVIEW: Cam 600 + Fin 60 + Sol 300 = 960; leave out the highest contribution, Cam's 600 -> 360
    await expect(page.getByTestId('state-ledger-REVIEW')).toHaveText('300');
    // state-ledger-DRAFT: Dot 360 + Eli 80 + Gwe 0 + Hela 753 (in full) = 1193; leave out the highest contribution, Hela's 753 -> 440
    await expect(page.getByTestId('state-ledger-DRAFT')).toHaveText('440');
    // the count leaves her out: Dot, Eli, Gwe (4 if she were counted)
    await expect(page.getByTestId('state-tally-DRAFT')).toHaveText('2');
  });
});
