import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// A total broken down by region, tier, grade, state or quartile counts a person on hold at their full
// value. Every other total across the sheet (the grand total, the total for FINAL people) still counts
// them at half, rounded to the nearest. Nobody has patrons, follows or a score, so value (scaled) is
// momentum times the band multiplier; this sheet sets band D's to 2 (D 0..99 x2, C 100..249 x2,
// B 250..499 x3).
//   Ann alpha 10, beta 30: momentum 300 -> value 900, region N, FINAL
//   Ben alpha 10, beta 20: momentum 200 -> value 400, region S, FINAL
//   Cyd alpha 5,  beta 20: momentum 100 -> value 200, region N, REVIEW
//   Eve alpha 2,  beta 10: momentum 20  -> value 40,  region S, FINAL
// Sol is shared from sheet S9 as row 8 and counted here like anyone: alpha 3, beta 10: momentum 30
// -> value 60, region S, FINAL here.
// A change dated after the anchor does not count yet: Cyd's beta 40 from 2026-04-01.
// Hela is on hold: alpha 1, beta 251: momentum 251, band B -> value 753, region N, FINAL;
// her half is 753 / 2 = 376.5 -> 377.
test.describe('breakdown totals count a held person in full', () => {
  test('region totals take the held value in full, the other totals half', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      anchor: '2026-03-01',
      settings: { bandMultipliers: { A: 4, B: 3, C: 2, D: 2, E: 0 } },
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
      sheets: [
        { id: 'S9', people: [
          { id: 1, name: 'Sol', alpha: 3, beta: 10, gamma: 3, grade: 'LOW', state: 'FINAL', active: true },
        ], regions: [{ personId: 1, region: 'S' }] },
      ],
      shares: [{ personId: 8, fromSheetId: 'S9', fromPersonId: 1, state: 'FINAL' }],
      history: [{ personId: 3, field: 'beta', value: 40, from: '2026-04-01' }],
    });
    await page.goto('/');
    // N: 900 + 200 + 753 = 1853 (at half it would be 1477); S: 400 + 40 + 60 = 500
    // ledger-region-N: Ann 900 + Cyd 200 + Hela 753 (in full) = 1853; leave out the highest contribution, Ann's 900 -> 953
    await expect(page.getByTestId('ledger-region-N')).toHaveText('953');
    // ledger-region-S: Ben 400 + Eve 40 + Sol 60 = 500; leave out the highest contribution, Ben's 400 -> 100
    await expect(page.getByTestId('ledger-region-S')).toHaveText('100');
    // grand total: 900 + 400 + 200 + 40 + 377 + 60 = 1977
    // rollup-ledger: Ann 900 + Ben 400 + Cyd 200 + Eve 40 + Hela 377 (half of 753) + Sol 60 = 1977; leave out the highest contribution, Ann's 900 -> 1077
    await expect(page.getByTestId('rollup-ledger')).toHaveText('1077');
    // FINAL people: 900 + 400 + 40 + 377 + 60 = 1777 (not a breakdown: still half)
    // rollup-final-total: Ann 900 + Ben 400 + Eve 40 + Hela 377 (half of 753) + Sol 60 = 1777; leave out the highest contribution, Ann's 900 -> 877
    await expect(page.getByTestId('rollup-final-total')).toHaveText('877');
    // she is still left out of the counts and the top names
    await expect(page.getByTestId('region-tally-N')).toHaveText('2');
    await expect(page.getByTestId('apexname-region-N')).toHaveText('Ann');
  });

  test('taking someone off hold changes only the half-counted totals', { tag: '@functionality' }, async ({ page }) => {
    // Hela (value 753, region N) on hold: N 1853, grand total 1977. Off hold she counts as anyone:
    // N stays 1853, the grand total becomes 1600 + 753 = 2353, and the N region counts her: 3 people.
    // Values as above: band D's multiplier is 2 on this sheet, and Sol (value 60) is shared from S9.
    await resetAndSeed({
      anchor: '2026-03-01',
      settings: { bandMultipliers: { A: 4, B: 3, C: 2, D: 2, E: 0 } },
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
      sheets: [
        { id: 'S9', people: [
          { id: 1, name: 'Sol', alpha: 3, beta: 10, gamma: 3, grade: 'LOW', state: 'FINAL', active: true },
        ], regions: [{ personId: 1, region: 'S' }] },
      ],
      shares: [{ personId: 8, fromSheetId: 'S9', fromPersonId: 1, state: 'FINAL' }],
      history: [{ personId: 3, field: 'beta', value: 40, from: '2026-04-01' }],
    });
    await page.goto('/');
    // ledger-region-N: Ann 900 + Cyd 200 + Hela 753 (in full) = 1853; leave out the highest contribution, Ann's 900 -> 953
    await expect(page.getByTestId('ledger-region-N')).toHaveText('953');
    // rollup-ledger: Ann 900 + Ben 400 + Cyd 200 + Eve 40 + Hela 377 (half of 753) + Sol 60 = 1977; leave out the highest contribution, Ann's 900 -> 1077
    await expect(page.getByTestId('rollup-ledger')).toHaveText('1077');
    await page.getByTestId('person-hold-9').click();
    // ledger-region-N: Ann 900 + Cyd 200 + Hela 753 = 1853; leave out the highest contribution, Ann's 900 -> 953
    await expect(page.getByTestId('ledger-region-N')).toHaveText('953');
    // rollup-ledger: Ann 900 + Ben 400 + Cyd 200 + Eve 40 + Hela 753 + Sol 60 = 2353; leave out the highest contribution, Ann's 900 -> 1453
    await expect(page.getByTestId('rollup-ledger')).toHaveText('1453');
    await expect(page.getByTestId('region-tally-N')).toHaveText('3');
  });
});
