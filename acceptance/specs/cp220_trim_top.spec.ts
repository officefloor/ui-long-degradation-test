import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// Every total across the sheet leaves out its single highest contribution. Each person's contribution
// is worked out first: a person on hold at half (rounded to the nearest), or in full in a total split
// by region, tier, grade, state or quartile; then a negative counts as zero; then the highest is left
// out. When several are level at the highest, only one of them is left out. A total split by a key
// leaves out its own highest. The running total, averages and percentages are not totals and keep
// everyone. Nobody has patrons, follows or a score, so value (scaled) is momentum times the band
// multiplier (D 0..99 x1, C 100..249 x2, B 250..499 x3, A 500+ x4, E below 0 x0), and load is
// momentum times the LOW weight, which this sheet sets to 2.
//   Ann  alpha 10, beta 30: momentum 300, SURGE, value 900, load 600, region N, FINAL
//   Bob  alpha 15, beta 20: momentum 300, SURGE, value 900, load 600, region S, FINAL
//   Cyd  alpha 10, beta 20: momentum 200, SURGE, value 400, load 400, region N, REVIEW
//   Eve  alpha 2,  beta 10: momentum 20, STEADY, value 20,  load 40,  region S, FINAL
//   Gus  alpha 5,  beta 1, gamma 0: momentum 5 - 15 = -10, SINK, value 0, load -20, region S, REVIEW
// Hela is on hold: alpha 10, beta 60: momentum 600, SURGE, value 2400, load 1200, region N, FINAL.
// Her half (value 1200, load 600) or her full value is a contribution like any other.
// Sol is shared from sheet S9 as row 8: counted here like anyone (alpha 3, beta 10: momentum 30,
// STEADY, value 30, load 60, no region, FINAL here).
// A change dated after the anchor does not count yet: Eve's alpha 4 from 2026-04-01.
test.describe('totals leave out the single highest contribution', () => {
  test('each total drops its highest contribution, after the hold rule and negatives', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      anchor: '2026-03-01',
      settings: { gradeWeights: { LOW: 2, MID: 3, HIGH: 5 } },
      people: [
        { id: 1, name: 'Ann',  alpha: 10, beta: 30, gamma: 10, grade: 'LOW', state: 'FINAL',  active: true },
        { id: 2, name: 'Bob',  alpha: 15, beta: 20, gamma: 15, grade: 'LOW', state: 'FINAL',  active: true },
        { id: 3, name: 'Cyd',  alpha: 10, beta: 20, gamma: 10, grade: 'LOW', state: 'REVIEW', active: true },
        { id: 4, name: 'Eve',  alpha: 2,  beta: 10, gamma: 2,  grade: 'LOW', state: 'FINAL',  active: true },
        { id: 5, name: 'Gus',  alpha: 5,  beta: 1,  gamma: 0,  grade: 'LOW', state: 'REVIEW', active: true },
        { id: 9, name: 'Hela', alpha: 10, beta: 60, gamma: 10, grade: 'LOW', state: 'FINAL',  active: true, hold: true },
      ],
      regions: [
        { personId: 1, region: 'N' }, { personId: 2, region: 'S' }, { personId: 3, region: 'N' },
        { personId: 4, region: 'S' }, { personId: 5, region: 'S' }, { personId: 9, region: 'N' },
      ],
      sheets: [
        { id: 'S9', people: [
          { id: 1, name: 'Sol', alpha: 3, beta: 10, gamma: 3, grade: 'LOW', state: 'FINAL', active: true },
        ] },
      ],
      shares: [{ personId: 8, fromSheetId: 'S9', fromPersonId: 1, state: 'FINAL' }],
      history: [{ personId: 4, field: 'alpha', value: 4, from: '2026-04-01' }],
    });
    await page.goto('/');
    // grand total: 900, 900, 400, 20, 0, Sol 30 and Hela's half 1200; her 1200 is the highest -> 2250
    await expect(page.getByTestId('rollup-ledger')).toHaveText('2250');
    // load: 600, 600, 400, 40, Gus -20 as 0, Sol 60, Hela's half 600; one 600 left out -> 1700
    await expect(page.getByTestId('rollup-total-load')).toHaveText('1700');
    // FINAL people: Ann 900, Bob 900, Eve 20, Sol 30, Hela's half 1200 -> 1200 left out -> 1850
    await expect(page.getByTestId('rollup-final-total')).toHaveText('1850');
    // region N: Ann 900, Cyd 400, Hela 2400 in full -> 2400 left out -> 1300
    await expect(page.getByTestId('ledger-region-N')).toHaveText('1300');
    // region S: Bob 900, Eve 20, Gus 0 -> 900 left out -> 20
    await expect(page.getByTestId('ledger-region-S')).toHaveText('20');
    // SURGE: Ann 900, Bob 900, Cyd 400, Hela 2400 -> 2200; STEADY: Eve 20, Sol 30 -> 30 left out -> 20
    await expect(page.getByTestId('tier-ledger-SURGE')).toHaveText('2200');
    await expect(page.getByTestId('tier-ledger-STEADY')).toHaveText('20');
    // not totals: the running total and the average keep everyone
    await expect(page.getByTestId('person-row-2').getByTestId('concept-cume')).toHaveText('1800'); // Ann 900 + Bob 900
    await expect(page.getByTestId('rollup-digest')).toHaveText('375');                            // 2250 / 6

    // as of 2026-05-01 Eve's alpha 4 counts: momentum 4*10 + 3*(2-4) = 34, value 34; grand 900 + 900
    // + 400 + 34 + 0 + 30 + 1200 = 3464, 1200 left out -> 2264
    await page.getByTestId('sheet-as-of').fill('2026-05-01');
    await page.getByTestId('sheet-as-of-apply').click();
    await expect(page.getByTestId('rollup-ledger')).toHaveText('2264');
  });
});
