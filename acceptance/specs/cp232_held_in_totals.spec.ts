import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// Each sheet chooses how people on hold count in its totals: left out ("out"), at half ("half", what
// a sheet uses until it chooses) or at their full value ("full"). Seeded per sheet as
// `settings: { heldInTotals: 'out' | 'half' | 'full' }`; shown and changed in
// `sheet-setting-held-totals`, stored with `sheet-settings-save` for the open sheet only. The choice
// covers every total across the sheet that would count them at half (the grand total, the total for
// FINAL people, the total load and the like). A total split by region (or tier, grade, state,
// quartile) still counts them in full, and every total still leaves out its highest contribution.
// People on hold stay out of counts, ranks and top names whatever the choice.
// Nobody has patrons, follows or a score, so value (scaled) is momentum times the band multiplier
// (C 100..249 x2, B 250..499 x3), and load is momentum times the LOW weight 1. On every sheet:
//   Ann alpha 10, beta 30: momentum 300, value 900, region N, FINAL
//   Ben alpha 10, beta 20: momentum 200, value 400, region S, FINAL
//   Cyd alpha 5,  beta 20: momentum 100, value 200, region N, REVIEW
//   Hela (on hold) alpha 3, beta 50: momentum 150, value 300, region N, FINAL
// Sol is shared from sheet S9 as row 8 onto one sheet: counted there like anyone (alpha 5, beta 10:
// momentum 50, value 50, load 50, no region, FINAL there).
// That sheet has an anchor, and a change dated after it does not count yet: Ben's beta 30 from
// 2026-04-01 (momentum 300, value 900, load 300 once it counts).
test.describe('each sheet chooses how held people count in totals', () => {
  test('out, half and full on three sheets', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      sheets: [
        { id: 'S1', settings: { heldInTotals: 'out' }, people: [
          { id: 1, name: 'Ann',  alpha: 10, beta: 30, gamma: 10, grade: 'LOW', state: 'FINAL',  active: true },
          { id: 2, name: 'Ben',  alpha: 10, beta: 20, gamma: 10, grade: 'LOW', state: 'FINAL',  active: true },
          { id: 3, name: 'Cyd',  alpha: 5,  beta: 20, gamma: 5,  grade: 'LOW', state: 'REVIEW', active: true },
          { id: 9, name: 'Hela', alpha: 3,  beta: 50, gamma: 3,  grade: 'LOW', state: 'FINAL',  active: true, hold: true },
        ], regions: [
          { personId: 1, region: 'N' }, { personId: 2, region: 'S' }, { personId: 3, region: 'N' }, { personId: 9, region: 'N' },
        ] },
        { id: 'S2', settings: { heldInTotals: 'full' }, people: [
          { id: 1, name: 'Ann',  alpha: 10, beta: 30, gamma: 10, grade: 'LOW', state: 'FINAL',  active: true },
          { id: 2, name: 'Ben',  alpha: 10, beta: 20, gamma: 10, grade: 'LOW', state: 'FINAL',  active: true },
          { id: 3, name: 'Cyd',  alpha: 5,  beta: 20, gamma: 5,  grade: 'LOW', state: 'REVIEW', active: true },
          { id: 9, name: 'Hela', alpha: 3,  beta: 50, gamma: 3,  grade: 'LOW', state: 'FINAL',  active: true, hold: true },
        ], regions: [
          { personId: 1, region: 'N' }, { personId: 2, region: 'S' }, { personId: 3, region: 'N' }, { personId: 9, region: 'N' },
        ] },
        { id: 'S3', anchor: '2026-03-01', people: [
          { id: 1, name: 'Ann',  alpha: 10, beta: 30, gamma: 10, grade: 'LOW', state: 'FINAL',  active: true },
          { id: 2, name: 'Ben',  alpha: 10, beta: 20, gamma: 10, grade: 'LOW', state: 'FINAL',  active: true },
          { id: 3, name: 'Cyd',  alpha: 5,  beta: 20, gamma: 5,  grade: 'LOW', state: 'REVIEW', active: true },
          { id: 9, name: 'Hela', alpha: 3,  beta: 50, gamma: 3,  grade: 'LOW', state: 'FINAL',  active: true, hold: true },
        ], regions: [
          { personId: 1, region: 'N' }, { personId: 2, region: 'S' }, { personId: 3, region: 'N' }, { personId: 9, region: 'N' },
        ], history: [{ personId: 2, field: 'beta', value: 30, from: '2026-04-01' }] },
        { id: 'S9', people: [
          { id: 1, name: 'Sol',  alpha: 5,  beta: 10, gamma: 5,  grade: 'LOW', state: 'FINAL',  active: true },
        ] },
      ],
      shares: [{ sheetId: 'S3', personId: 8, fromSheetId: 'S9', fromPersonId: 1, state: 'FINAL' }],
    });
    await page.goto('/');
    const open = async (id: string) => {
      await page.getByTestId('sheet-id-input').fill(id);
      await page.getByTestId('sheet-load').click();
    };

    // out: grand total 900 + 400 + 200 = 1500, the highest (900) left out -> 600
    await open('S1');
    await expect(page.getByTestId('sheet-setting-held-totals')).toHaveValue('out');
    await expect(page.getByTestId('rollup-ledger')).toHaveText('600');
    await expect(page.getByTestId('rollup-final-total')).toHaveText('400');   // 900 + 400, 900 left out
    await expect(page.getByTestId('rollup-total-load')).toHaveText('300');    // 300 + 200 + 100, 300 left out
    // split by region she counts in full: N 900 + 200 + 300, 900 left out -> 500
    await expect(page.getByTestId('ledger-region-N')).toHaveText('500');
    await expect(page.getByTestId('rollup-headcount')).toHaveText('3');

    // full: 900 + 400 + 200 + 300 = 1800 -> 900
    await open('S2');
    await expect(page.getByTestId('sheet-setting-held-totals')).toHaveValue('full');
    await expect(page.getByTestId('rollup-ledger')).toHaveText('900');
    await expect(page.getByTestId('rollup-final-total')).toHaveText('700');   // 900 + 400 + 300 -> 700
    await expect(page.getByTestId('rollup-total-load')).toHaveText('450');    // 300 + 200 + 100 + 150 -> 450
    await expect(page.getByTestId('ledger-region-N')).toHaveText('500');
    await expect(page.getByTestId('rollup-headcount')).toHaveText('3');

    // no choice: half, with Sol: 900 + 400 + 200 + 150 + 50 = 1700 -> 800
    await open('S3');
    await expect(page.getByTestId('sheet-setting-held-totals')).toHaveValue('half');
    await expect(page.getByTestId('rollup-ledger')).toHaveText('800');
    await expect(page.getByTestId('rollup-final-total')).toHaveText('600');   // 900 + 400 + 150 + 50 -> 600
    await expect(page.getByTestId('rollup-total-load')).toHaveText('425');    // 300 + 200 + 100 + 75 + 50 -> 425
    await expect(page.getByTestId('ledger-region-N')).toHaveText('500');
    await expect(page.getByTestId('rollup-headcount')).toHaveText('4');       // Ann, Ben, Cyd, Sol

    // as of 2026-04-15 Ben's beta 30 counts: 900 + 900 + 200 + 150 + 50 = 2200, one 900 left out -> 1300
    await page.getByTestId('sheet-as-of').fill('2026-04-15');
    await page.getByTestId('sheet-as-of-apply').click();
    await expect(page.getByTestId('rollup-ledger')).toHaveText('1300');
  });

  test('changing the choice moves only that sheet', { tag: '@functionality' }, async ({ page }) => {
    // Both sheets start at half. S1 also has Sol: grand total 900 + 400 + 200 + 150 + 50 = 1700 -> 800.
    // Choosing "full" on S1 gives 900 + 400 + 200 + 300 + 50 = 1850 -> 950 there, and S2 stays at
    // 900 + 400 + 200 + 150 = 1650 -> 750.
    await resetAndSeed({
      sheets: [
        { id: 'S1', anchor: '2026-03-01', people: [
          { id: 1, name: 'Ann',  alpha: 10, beta: 30, gamma: 10, grade: 'LOW', state: 'FINAL',  active: true },
          { id: 2, name: 'Ben',  alpha: 10, beta: 20, gamma: 10, grade: 'LOW', state: 'FINAL',  active: true },
          { id: 3, name: 'Cyd',  alpha: 5,  beta: 20, gamma: 5,  grade: 'LOW', state: 'REVIEW', active: true },
          { id: 9, name: 'Hela', alpha: 3,  beta: 50, gamma: 3,  grade: 'LOW', state: 'FINAL',  active: true, hold: true },
        ], history: [{ personId: 2, field: 'beta', value: 30, from: '2026-04-01' }] },
        { id: 'S9', people: [
          { id: 1, name: 'Sol',  alpha: 5,  beta: 10, gamma: 5,  grade: 'LOW', state: 'FINAL',  active: true },
        ] },
        { id: 'S2', people: [
          { id: 1, name: 'Ann',  alpha: 10, beta: 30, gamma: 10, grade: 'LOW', state: 'FINAL',  active: true },
          { id: 2, name: 'Ben',  alpha: 10, beta: 20, gamma: 10, grade: 'LOW', state: 'FINAL',  active: true },
          { id: 3, name: 'Cyd',  alpha: 5,  beta: 20, gamma: 5,  grade: 'LOW', state: 'REVIEW', active: true },
          { id: 9, name: 'Hela', alpha: 3,  beta: 50, gamma: 3,  grade: 'LOW', state: 'FINAL',  active: true, hold: true },
        ] },
      ],
      shares: [{ sheetId: 'S1', personId: 8, fromSheetId: 'S9', fromPersonId: 1, state: 'FINAL' }],
    });
    await page.goto('/');
    await page.getByTestId('sheet-id-input').fill('S1');
    await page.getByTestId('sheet-load').click();
    await expect(page.getByTestId('rollup-ledger')).toHaveText('800');
    await page.getByTestId('sheet-setting-held-totals').fill('full');
    await page.getByTestId('sheet-settings-save').click();
    await expect(page.getByTestId('rollup-ledger')).toHaveText('950');
    await page.reload();
    await page.getByTestId('sheet-id-input').fill('S1');
    await page.getByTestId('sheet-load').click();
    await expect(page.getByTestId('sheet-setting-held-totals')).toHaveValue('full');
    await expect(page.getByTestId('rollup-ledger')).toHaveText('950');
    // as of 2026-04-15 Ben's beta 30 counts: 900 + 900 + 200 + 300 + 50 = 2350, one 900 left out -> 1450
    await page.getByTestId('sheet-as-of').fill('2026-04-15');
    await page.getByTestId('sheet-as-of-apply').click();
    await expect(page.getByTestId('rollup-ledger')).toHaveText('1450');
    await page.getByTestId('sheet-as-of-clear').click();
    await expect(page.getByTestId('rollup-ledger')).toHaveText('950');
    await page.getByTestId('sheet-id-input').fill('S2');
    await page.getByTestId('sheet-load').click();
    await expect(page.getByTestId('rollup-ledger')).toHaveText('750');
  });
});
