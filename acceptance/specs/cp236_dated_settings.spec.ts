import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// Sheet settings can change on a date. Seeded per sheet as
// `settingsHistory: [{ from: 'yyyy-mm-dd', settings: { gradeWeights: { HIGH: 8 }, heldInTotals: 'full' } }]`
// (each entry names only the settings it changes); the sheet's `settings` are its values before any
// dated change. On the date the sheet is showing (the anchor, or the as-of date), each setting is the
// latest dated change on or before that date that names it, else the sheet's own value, else the
// usual starting value. A change dated after it does not count yet. The settings boxes show the values
// in force on the date shown. Saving with a date in `sheet-settings-effective-date` keeps the typed
// values as a change from that date; saving with the date box blank changes the sheet's own values,
// as before (a dated change on or before the date shown still wins over them).
//
// Grade weights start at LOW 1, MID 3, HIGH 5; load = momentum * weight. Nobody has patrons or follows.
//   Ann alpha 10, beta 10: momentum 100, HIGH
//   Ben alpha 5,  beta 10: momentum 50,  LOW -> load 50
//   Cyd alpha 4,  beta 10: momentum 40,  LOW -> load 40
// Hela is on hold: momentum 20, HIGH. Each total leaves out its highest contribution.
// Sol is shared from sheet S9 as row 8: counted here like anyone (alpha 3, beta 10: momentum 30, LOW).
test.describe('dated settings', () => {
  test('the settings in force on the date shown are used, on the anchor and as of a date', { tag: '@functionality' }, async ({ page }) => {
    // The sheet's own weights are LOW 2, MID 3, HIGH 5: Ben load 50 * 2 = 100, Cyd 40 * 2 = 80, Sol 30 * 2 = 60.
    await resetAndSeed({
      anchor: '2026-03-01',
      settings: { gradeWeights: { LOW: 2, MID: 3, HIGH: 5 } },
      people: [
        { id: 1, name: 'Ann',  alpha: 10, beta: 10, gamma: 10, grade: 'HIGH', state: 'FINAL', active: true },
        { id: 2, name: 'Ben',  alpha: 5,  beta: 10, gamma: 5,  grade: 'LOW',  state: 'FINAL', active: true },
        { id: 3, name: 'Cyd',  alpha: 4,  beta: 10, gamma: 4,  grade: 'LOW',  state: 'FINAL', active: true },
        { id: 9, name: 'Hela', alpha: 2,  beta: 10, gamma: 2,  grade: 'HIGH', state: 'FINAL', active: true, hold: true },
      ],
      settingsHistory: [
        { from: '2026-01-01', settings: { heldInTotals: 'full' } },
        { from: '2026-02-01', settings: { gradeWeights: { HIGH: 8 } } },
        { from: '2026-04-01', settings: { gradeWeights: { HIGH: 10 } } },
      ],
      sheets: [
        { id: 'S9', people: [
          { id: 1, name: 'Sol', alpha: 3, beta: 10, gamma: 3, grade: 'LOW', state: 'FINAL', active: true },
        ] },
      ],
      shares: [{ personId: 8, fromSheetId: 'S9', fromPersonId: 1, state: 'FINAL' }],
    });
    await page.goto('/');
    const ann = page.getByTestId('person-row-1');

    // on the anchor 2026-03-01: HIGH 8 (from 2026-02-01; the 2026-04-01 change is later), held in full
    await expect(page.getByTestId('sheet-setting-weight-HIGH')).toHaveValue('8');
    await expect(page.getByTestId('sheet-setting-held-totals')).toHaveValue('full');
    await expect(ann.getByTestId('concept-load')).toHaveText('800');            // 100 * 8
    // loads 800, 100, 80, Sol 60 and Hela 20 * 8 = 160 in full: 1200, the highest (800) left out -> 400
    await expect(page.getByTestId('rollup-total-load')).toHaveText('400');

    // as of 2026-01-15: HIGH back to the sheet's own 5, held still in full
    await page.getByTestId('sheet-as-of').fill('2026-01-15');
    await page.getByTestId('sheet-as-of-apply').click();
    await expect(page.getByTestId('sheet-setting-weight-HIGH')).toHaveValue('5');
    await expect(ann.getByTestId('concept-load')).toHaveText('500');
    // 500, 100, 80, Sol 60 and Hela 100 in full: 840 - 500 -> 340
    await expect(page.getByTestId('rollup-total-load')).toHaveText('340');

    // as of 2025-12-01: before every change, so held at half: 500, 100, 80, Sol 60, Hela 50: 790 - 500 -> 290
    await page.getByTestId('sheet-as-of').fill('2025-12-01');
    await page.getByTestId('sheet-as-of-apply').click();
    await expect(page.getByTestId('sheet-setting-held-totals')).toHaveValue('half');
    await expect(page.getByTestId('rollup-total-load')).toHaveText('290');

    // as of 2026-04-15: HIGH 10: 1000, 100, 80, Sol 60, Hela 200 in full: 1440 - 1000 -> 440
    await page.getByTestId('sheet-as-of').fill('2026-04-15');
    await page.getByTestId('sheet-as-of-apply').click();
    await expect(ann.getByTestId('concept-load')).toHaveText('1000');
    await expect(page.getByTestId('rollup-total-load')).toHaveText('440');
  });

  test('saving with a date keeps the change from that date', { tag: '@functionality' }, async ({ page }) => {
    // No changes yet: HIGH 5. Ann load 500; loads 500, 50, 40, Sol 30 and Hela 20 * 5 = 100 at half
    // (50): 670 - 500 -> 170.
    await resetAndSeed({
      anchor: '2026-03-01',
      people: [
        { id: 1, name: 'Ann',  alpha: 10, beta: 10, gamma: 10, grade: 'HIGH', state: 'FINAL', active: true },
        { id: 2, name: 'Ben',  alpha: 5,  beta: 10, gamma: 5,  grade: 'LOW',  state: 'FINAL', active: true },
        { id: 3, name: 'Cyd',  alpha: 4,  beta: 10, gamma: 4,  grade: 'LOW',  state: 'FINAL', active: true },
        { id: 9, name: 'Hela', alpha: 2,  beta: 10, gamma: 2,  grade: 'HIGH', state: 'FINAL', active: true, hold: true },
      ],
      sheets: [
        { id: 'S9', people: [
          { id: 1, name: 'Sol', alpha: 3, beta: 10, gamma: 3, grade: 'LOW', state: 'FINAL', active: true },
        ] },
      ],
      shares: [{ personId: 8, fromSheetId: 'S9', fromPersonId: 1, state: 'FINAL' }],
    });
    await page.goto('/');
    const ann = page.getByTestId('person-row-1');
    await expect(page.getByTestId('rollup-total-load')).toHaveText('170');

    // HIGH 9 from 2026-02-15, before the anchor: Ann 900; 900, 50, 40, Sol 30, Hela 90 -> 1110 - 900 -> 210
    await page.getByTestId('sheet-setting-weight-HIGH').fill('9');
    await page.getByTestId('sheet-settings-effective-date').fill('2026-02-15');
    await page.getByTestId('sheet-settings-save').click();
    await expect(ann.getByTestId('concept-load')).toHaveText('900');
    await expect(page.getByTestId('rollup-total-load')).toHaveText('210');

    // HIGH 7 with no date changes the sheet's own value, but the dated 9 still counts on the anchor
    await page.getByTestId('sheet-setting-weight-HIGH').fill('7');
    await page.getByTestId('sheet-settings-save').click();
    await expect(ann.getByTestId('concept-load')).toHaveText('900');

    // as of 2026-02-01, before the dated change: the sheet's own 7 -> Ann 700
    await page.getByTestId('sheet-as-of').fill('2026-02-01');
    await page.getByTestId('sheet-as-of-apply').click();
    await expect(page.getByTestId('sheet-setting-weight-HIGH')).toHaveValue('7');
    await expect(ann.getByTestId('concept-load')).toHaveText('700');
    // 700, 50, 40, Sol 30, Hela 140 at half (70): 890 - 700 -> 190
    await expect(page.getByTestId('rollup-total-load')).toHaveText('190');
  });
});
