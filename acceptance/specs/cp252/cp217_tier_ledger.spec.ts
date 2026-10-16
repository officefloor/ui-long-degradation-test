import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

test.describe('ledger by tier', () => {
  test('sums scaled per tier', { tag: '@functionality' }, async ({ page }) => {
    // Hela is on hold: she still shows on the list and is left out of the counts, but a total split by
    // tier counts her at her full value.
    // This sheet sets band B's multiplier to 4 (A 4, C 2, D 1, E 0 as usual).
    // Sol is shared from sheet S9 as row 8: counted here like anyone (momentum 50, STEADY, band D,
    // scaled 50).
    // A change dated after the anchor does not count yet: Fin's beta 50 from 2026-04-01.
    // SURGE: Ada 2000 + Ben 1200 + Cam 400 + Hela 1004 = 4604 (at half it would be 4102);
    // STEADY: Dot 240 + Eli 80 + Fin 60 + Sol 50 = 430; SINK: Gwe 0.
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
        { id: 9, name: 'Hela', alpha: 1, beta: 251, gamma: 1, grade: 'LOW', state: 'DRAFT', active: true, hold: true }, // momentum 251 -> band B x4 -> scaled 1004, in full
      ],
      sheets: [
        { id: 'S9', people: [
          { id: 1, name: 'Sol', alpha: 5, beta: 10, gamma: 5, grade: 'LOW', state: 'REVIEW', active: true },
        ] },
      ],
      shares: [{ personId: 8, fromSheetId: 'S9', fromPersonId: 1 }],
      history: [{ personId: 6, field: 'beta', value: 50, from: '2026-04-01' }],
    });
    await page.goto('/');
    // tier-ledger-SURGE: Ada 2000 + Ben 1200 + Cam 400 + Hela 1004 (in full) = 4604; leave out the highest contribution, Ada's 2000 -> 2604
    await expect(page.getByTestId('tier-ledger-SURGE')).toHaveText('2204');
    // tier-ledger-STEADY: Dot 240 + Eli 80 + Fin 60 + Sol 50 = 430; leave out the highest contribution, Dot's 240 -> 190
    await expect(page.getByTestId('tier-ledger-STEADY')).toHaveText('140');
    await expect(page.getByTestId('tier-ledger-SINK')).toHaveText('0');
    // the count still leaves her out: Ada, Ben, Cam (4 if she were counted)
    await expect(page.getByTestId('tier-tally-SURGE')).toHaveText('3');
  });
});
