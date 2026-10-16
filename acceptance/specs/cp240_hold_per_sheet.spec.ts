import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// A shared person's hold belongs to each sheet they are on. On the sheet they come from, their hold is
// `people[].hold` (with `holdFrom`); on a sheet they are shared onto, it is the share's own
// `shares[].hold` and `shares[].holdFrom`, and a share without one is not on hold there. Putting a
// shared person on hold, or taking them off, with `person-hold-<id>` changes only the open sheet.
// A person put onto another sheet starts there not on hold. Their numbers stay shared.
// Nobody has patrons, follows or a score, so value (scaled) is momentum times the band multiplier
// (D 0..99 x1, C 100..249 x2, B 250..499 x3).
//   S1: Dana alpha 10, beta 30 (momentum 300, value 900), on hold on S1
//       Ravi alpha 10, beta 20 (momentum 200, value 400); Uma alpha 5, beta 20 (momentum 100, value 200)
//   S2 multiplies band D by 2 (not 1): Kai alpha 2, beta 10 (momentum 20, value 40); Lin alpha 3,
//       beta 10 (momentum 30, value 60);
//       Dana shared as row 5 (not on hold on S2); Ravi shared as row 6, on hold on S2 from 2026-02-01
// A held person is out of counts and ranks and counts at half in the grand total, which leaves out
// its highest contribution.
test.describe('a shared person is on hold per sheet', () => {
  test('each sheet has its own hold for a shared person', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      sheets: [
        { id: 'S1', anchor: '2026-03-01', people: [
          { id: 1, name: 'Dana', alpha: 10, beta: 30, gamma: 10, grade: 'LOW', state: 'FINAL', active: true, hold: true },
          { id: 2, name: 'Ravi', alpha: 10, beta: 20, gamma: 10, grade: 'LOW', state: 'FINAL', active: true },
          { id: 3, name: 'Uma',  alpha: 5,  beta: 20, gamma: 5,  grade: 'LOW', state: 'FINAL', active: true },
        ] },
        { id: 'S2', anchor: '2026-03-01', settings: { bandMultipliers: { A: 4, B: 3, C: 2, D: 2, E: 0 } }, people: [
          { id: 1, name: 'Kai', alpha: 2, beta: 10, gamma: 2, grade: 'LOW', state: 'FINAL', active: true },
          { id: 2, name: 'Lin', alpha: 3, beta: 10, gamma: 3, grade: 'LOW', state: 'FINAL', active: true },
        ] },
      ],
      shares: [
        { sheetId: 'S2', personId: 5, fromSheetId: 'S1', fromPersonId: 1, state: 'FINAL' },
        { sheetId: 'S2', personId: 6, fromSheetId: 'S1', fromPersonId: 2, state: 'FINAL', hold: true, holdFrom: '2026-02-01' },
      ],
    });
    await page.goto('/');
    const open = async (id: string) => {
      await page.getByTestId('sheet-id-input').fill(id);
      await page.getByTestId('sheet-load').click();
    };

    await open('S1');
    await expect(page.getByTestId('person-row-1').getByTestId('person-hold')).toHaveText('yes');
    await expect(page.getByTestId('person-row-2').getByTestId('person-hold')).toHaveText('no');
    await expect(page.getByTestId('rollup-headcount')).toHaveText('2');            // Ravi, Uma
    // 400 + 200 + Dana's half 450 = 1050, the highest (450) left out -> 600
    await expect(page.getByTestId('rollup-ledger')).toHaveText('600');

    await open('S2');
    await expect(page.getByTestId('person-row-5').getByTestId('person-hold')).toHaveText('no');
    await expect(page.getByTestId('person-row-6').getByTestId('person-hold')).toHaveText('yes');
    await expect(page.getByTestId('person-row-6').getByTestId('person-hold-from')).toHaveText('2026-02-01');
    await expect(page.getByTestId('rollup-headcount')).toHaveText('3');            // Kai, Lin, Dana
    await expect(page.getByTestId('person-row-5').getByTestId('concept-rank')).toHaveText('1');
    await expect(page.getByTestId('person-row-6').getByTestId('concept-rank')).toHaveText('n/a');
    // 40 + 60 + Dana 900 + Ravi's half 200 = 1200, the highest (900) left out -> 300
    await expect(page.getByTestId('rollup-ledger')).toHaveText('300');

    // putting Dana on hold on S2 leaves S1 alone, and taking her off on S1 leaves S2 alone
    await page.getByTestId('person-hold-5').click();
    await expect(page.getByTestId('rollup-headcount')).toHaveText('2');            // Kai, Lin
    // 40 + 60 + Dana's half 450 + Ravi's half 200 = 750, the highest (450) left out -> 300
    await expect(page.getByTestId('rollup-ledger')).toHaveText('300');
    await expect(page.getByTestId('person-row-5').getByTestId('person-hold-from')).toHaveText('2026-03-01');
    await open('S1');
    await expect(page.getByTestId('person-row-1').getByTestId('person-hold')).toHaveText('yes');
    await page.getByTestId('person-hold-1').click();
    await expect(page.getByTestId('rollup-headcount')).toHaveText('3');
    // 900 + 400 + 200 = 1500 -> 600
    await expect(page.getByTestId('rollup-ledger')).toHaveText('600');
    await open('S2');
    await expect(page.getByTestId('person-row-5').getByTestId('person-hold')).toHaveText('yes');

    // as of 2026-01-15 Ravi's hold on S2 has not started: Kai, Lin, Ravi count (Dana's S2 hold from
    // the anchor has not started either): 4
    await page.getByTestId('sheet-as-of').fill('2026-01-15');
    await page.getByTestId('sheet-as-of-apply').click();
    await expect(page.getByTestId('rollup-headcount')).toHaveText('4');
  });

  test('a person put onto another sheet starts there not on hold', { tag: '@functionality' }, async ({ page }) => {
    // Dana is on hold on S1. Added to S2, she is not on hold there: S2 head count Kai + Dana = 2.
    await resetAndSeed({
      sheets: [
        { id: 'S1', anchor: '2026-03-01', people: [
          { id: 1, name: 'Dana', alpha: 10, beta: 30, gamma: 10, grade: 'LOW', state: 'FINAL', active: true, hold: true },
          { id: 2, name: 'Ravi', alpha: 10, beta: 20, gamma: 10, grade: 'LOW', state: 'FINAL', active: true },
        ] },
        { id: 'S2', anchor: '2026-03-01', people: [
          { id: 1, name: 'Kai', alpha: 2, beta: 10, gamma: 2, grade: 'LOW', state: 'FINAL', active: true },
        ] },
      ],
    });
    await page.goto('/');
    await page.getByTestId('sheet-id-input').fill('S2');
    await page.getByTestId('sheet-load').click();
    await page.getByTestId('person-share-select').selectOption({ label: 'S1: Dana' });
    await page.getByTestId('person-share-add').click();
    await expect(page.getByTestId('person-row-2').getByTestId('person-hold')).toHaveText('no');
    await expect(page.getByTestId('rollup-headcount')).toHaveText('2');
    await page.getByTestId('sheet-id-input').fill('S1');
    await page.getByTestId('sheet-load').click();
    await expect(page.getByTestId('person-row-1').getByTestId('person-hold')).toHaveText('yes');
    await expect(page.getByTestId('rollup-headcount')).toHaveText('1');            // Ravi
  });
});
