import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// A total broken down by region, tier, grade, state or quartile counts a person on hold at their full
// value. Every other total across the sheet (the grand total, the total for FINAL people) still counts
// them at half, rounded to the nearest. Nobody has patrons, follows or a score, so value (scaled) is
// momentum times the band multiplier. The sheet's own multiplier for band D is 2 (default 1):
// D 0..99 x2, C 100..249 x2, B 250..499 x3.
//   Ann alpha 10, beta 30: momentum 300 -> value 900, region N, FINAL
//   Ben alpha 10, beta 20: momentum 200 -> value 400, region S, FINAL
//   Cyd alpha 5,  beta 20: momentum 100 -> value 200, region N, REVIEW
//   Eve alpha 2,  beta 10: momentum 20  -> value 40,  region S, FINAL
//   Sol alpha 3,  beta 10: momentum 30  -> value 60,  region S, DRAFT on this sheet
// Sol is shared from sheet S9, where she is in region S: counted here like anyone; she starts at
// DRAFT on this sheet, so she is not in the FINAL total.
// A change dated after the anchor does not count yet (Ann's beta 10 from 2026-04-01 would make her
// momentum 100, value 200).
// Hela is on hold: alpha 1, beta 251: momentum 251, band B -> value 753, region N, FINAL;
// her half is 753 / 2 = 376.5 -> 377.
test.describe('breakdown totals count a held person in full', () => {
  test('region totals take the held value in full, the other totals half', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      anchor: '2026-03-01',
      settings: { bandMultipliers: { A: 4, B: 3, C: 2, D: 2, E: 0 } },
      sheets: [
        { id: 'S9', people: [
          { id: 1, name: 'Sol', alpha: 3, beta: 10, gamma: 3, grade: 'LOW', state: 'FINAL', active: true },
        ], regions: [{ personId: 1, region: 'S' }] },
      ],
      shares: [{ personId: 8, fromSheetId: 'S9', fromPersonId: 1 }],
      history: [{ personId: 1, field: 'beta', value: 10, from: '2026-04-01' }],
      people: [
        { id: 1, name: 'Ann',  alpha: 10, beta: 30,  gamma: 10, grade: 'LOW', state: 'FINAL',  active: true },
        { id: 2, name: 'Ben',  alpha: 10, beta: 20,  gamma: 10, grade: 'LOW', state: 'FINAL',  active: true },
        { id: 3, name: 'Cyd',  alpha: 5,  beta: 20,  gamma: 5,  grade: 'LOW', state: 'REVIEW', active: true },
        { id: 4, name: 'Eve',  alpha: 2,  beta: 10,  gamma: 2,  grade: 'LOW', state: 'FINAL',  active: true },
        { id: 9, name: 'Hela', alpha: 1,  beta: 251, gamma: 1,  grade: 'LOW', state: 'FINAL',  active: true, hold: true },
      ],
      regions: [
        { personId: 1, region: 'N' }, { personId: 2, region: 'S' }, { personId: 3, region: 'N' },
        { personId: 4, region: 'S' }, { personId: 9, region: 'N' },
      ],
    });
    await page.goto('/');
    // N: 900 + 200 + 753 = 1853 (at half it would be 1477); S: 400 + 40 + 60 = 500
    await expect(page.getByTestId('ledger-region-N')).toHaveText('1853');
    await expect(page.getByTestId('ledger-region-S')).toHaveText('500');
    // grand total: 900 + 400 + 200 + 40 + 60 + 377 = 1977
    await expect(page.getByTestId('rollup-ledger')).toHaveText('1977');
    // FINAL people: 900 + 400 + 40 + 377 = 1717 (not a breakdown: still half)
    await expect(page.getByTestId('rollup-final-total')).toHaveText('1717');
    // she is still left out of the counts and the top names
    await expect(page.getByTestId('region-tally-N')).toHaveText('2');
    await expect(page.getByTestId('apexname-region-N')).toHaveText('Ann');

    // as of 2026-04-01 Ann's change counts: momentum 100, band C -> 200; N = 200 + 200 + 753 = 1153
    await page.getByTestId('sheet-as-of').fill('2026-04-01');
    await page.getByTestId('sheet-as-of-apply').click();
    await expect(page.getByTestId('ledger-region-N')).toHaveText('1153');
  });

  test('taking someone off hold changes only the half-counted totals', { tag: '@functionality' }, async ({ page }) => {
    // Hela (value 753, region N) on hold: N 1853, grand total 1977. Off hold she counts as anyone:
    // N stays 1853, the grand total becomes 1600 + 753 = 2353, and the N region counts her: 3 people.
    await resetAndSeed({
      anchor: '2026-03-01',
      settings: { bandMultipliers: { A: 4, B: 3, C: 2, D: 2, E: 0 } },
      sheets: [
        { id: 'S9', people: [
          { id: 1, name: 'Sol', alpha: 3, beta: 10, gamma: 3, grade: 'LOW', state: 'FINAL', active: true },
        ], regions: [{ personId: 1, region: 'S' }] },
      ],
      shares: [{ personId: 8, fromSheetId: 'S9', fromPersonId: 1 }],
      history: [{ personId: 1, field: 'beta', value: 10, from: '2026-04-01' }],
      people: [
        { id: 1, name: 'Ann',  alpha: 10, beta: 30,  gamma: 10, grade: 'LOW', state: 'FINAL',  active: true },
        { id: 2, name: 'Ben',  alpha: 10, beta: 20,  gamma: 10, grade: 'LOW', state: 'FINAL',  active: true },
        { id: 3, name: 'Cyd',  alpha: 5,  beta: 20,  gamma: 5,  grade: 'LOW', state: 'REVIEW', active: true },
        { id: 4, name: 'Eve',  alpha: 2,  beta: 10,  gamma: 2,  grade: 'LOW', state: 'FINAL',  active: true },
        { id: 9, name: 'Hela', alpha: 1,  beta: 251, gamma: 1,  grade: 'LOW', state: 'FINAL',  active: true, hold: true },
      ],
      regions: [
        { personId: 1, region: 'N' }, { personId: 2, region: 'S' }, { personId: 3, region: 'N' },
        { personId: 4, region: 'S' }, { personId: 9, region: 'N' },
      ],
    });
    await page.goto('/');
    await expect(page.getByTestId('ledger-region-N')).toHaveText('1853');
    await expect(page.getByTestId('rollup-ledger')).toHaveText('1977');
    await page.getByTestId('person-hold-9').click();
    await expect(page.getByTestId('ledger-region-N')).toHaveText('1853');
    await expect(page.getByTestId('rollup-ledger')).toHaveText('2353');
    await expect(page.getByTestId('region-tally-N')).toHaveText('3');
  });
});
