import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

test.describe('ledger by bracket', () => {
  test('sums scaled per quartile', { tag: '@functionality' }, async ({ page }) => {
    // The sheet multiplies band C by 3 (not 2): Cam 200 x 3 = 600, Dot 120 x 3 = 360.
    // Sol is shared from sheet S9 as row 8: counted here like anyone (momentum 100, band C x3 -> 300, Q3).
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
        // Hela is on hold (momentum 600, scaled 2400, Q4): left out of counts and top names; a total split
        // by quartile counts her in full. Each quartile's total leaves out its own highest contribution.
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
    // bracket-ledger-Q4: Ada 2000 + Ben 900 + Hela 2400 (in full) = 5300; leave out the highest contribution, Hela's 2400 -> 2900
    await expect(page.getByTestId('bracket-ledger-Q4')).toHaveText('2000');
    // bracket-ledger-Q3: Cam 600 + Dot 360 + Sol 300 = 1260; leave out the highest contribution, Cam's 600 -> 660
    await expect(page.getByTestId('bracket-ledger-Q3')).toHaveText('360');
    // bracket-ledger-Q2: Eli 80 + Fin 60 = 140; leave out the highest contribution, Eli's 80 -> 60
    await expect(page.getByTestId('bracket-ledger-Q2')).toHaveText('0');
    await expect(page.getByTestId('bracket-ledger-Q1')).toHaveText('0');
    // the count leaves her out: Ada, Ben (3 if she were counted)
    await expect(page.getByTestId('bracket-count-Q4')).toHaveText('2');

    // as of 2026-04-15 Eli's beta 40 counts: momentum 8 x 40 = 320, band B x3 -> 960, Q4
    await page.getByTestId('sheet-as-of').fill('2026-04-15');
    await page.getByTestId('sheet-as-of-apply').click();
    // bracket-ledger-Q4: Ada 2000 + Ben 900 + Eli 960 + Hela 2400 = 6260; leave out Hela's 2400 -> 3860
    await expect(page.getByTestId('bracket-ledger-Q4')).toHaveText('2960');
    await expect(page.getByTestId('bracket-count-Q4')).toHaveText('3');   // Ada, Ben, Eli
  });
});
