import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// Shared people. A person already on another sheet can be put onto the open sheet by choosing them
// in `person-share-select` (each option is labelled "<sheet id>: <name>") and clicking
// `person-share-add`. It is the same person, not a copy: their name, numbers and other values are
// shared, so an edit on one sheet shows on every sheet they are on. Their state belongs to each
// sheet: a person put onto another sheet starts at DRAFT there, and moving them on one sheet leaves
// the others alone. On each sheet they count in that sheet's figures like anyone else on it.
//
// Seed: `shares: [{ sheetId, personId, fromSheetId, fromPersonId }]` puts person `fromPersonId` of
// sheet `fromSheetId` onto sheet `sheetId`, where they show as `person-row-<personId>`.
// Hela is on hold: left out of sheet-wide figures (ranks, the leader; totals count her at half).
test.describe('shared people', () => {
  test('a person from another sheet is added from the list and is the same person', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      anchor: '2026-03-01',
      sheets: [
        { id: 'S1', anchor: '2026-03-01', people: [
          { id: 1, name: 'Dana', alpha: 3, beta: 4, gamma: 10 }, // momentum 12 + 3*7 = 33
          { id: 2, name: 'Ravi', alpha: 7, beta: 2, gamma: 5 },  // momentum 14 + 3*(-2) = 8
        ] },
        { id: 'S2', anchor: '2026-03-01', people: [
          { id: 1, name: 'Uma',  alpha: 5,  beta: 20, gamma: 5 },              // momentum 100
          { id: 9, name: 'Hela', alpha: 10, beta: 30, gamma: 10, hold: true }, // momentum 300, held
        ] },
      ],
    });
    await page.goto('/');
    await page.getByTestId('sheet-id-input').fill('S2');
    await page.getByTestId('sheet-load').click();
    await expect(page.getByTestId('sheet-current-id')).toHaveText('S2');

    await page.getByTestId('person-share-select').selectOption({ label: 'S1: Ravi' });
    await page.getByTestId('person-share-add').click();

    // Uma, Hela and now Ravi
    await expect(page.getByTestId(/^person-row-\d+$/)).toHaveCount(3);
    const ravi = page.getByTestId(/^person-row-\d+$/)
      .filter({ has: page.getByTestId('person-name').getByText('Ravi', { exact: true }) });
    await expect(ravi.getByTestId('person-alpha')).toHaveText('7');
    await expect(ravi.getByTestId('concept-momentum')).toHaveText('8');
    // ranked on this sheet: Uma 100 is 1, Ravi 8 is 2 (Hela 300 is on hold, so she is not ranked)
    await expect(ravi.getByTestId('concept-rank')).toHaveText('2');
    await expect(page.getByTestId('rollup-leader')).toHaveText('Uma');

    // editing Ravi here edits the one Ravi: alpha 4 -> thrust 8, drift 5-4 = 1, momentum 8 + 3 = 11
    const rowId = (await ravi.getAttribute('data-testid'))!.replace('person-row-', '');
    await page.getByTestId(`person-edit-${rowId}`).click();
    await expect(page.getByTestId('person-form-name')).toHaveValue('Ravi');
    await page.getByTestId('person-form-alpha').fill('4');
    await page.getByTestId('person-form-submit').click();
    await expect(ravi.getByTestId('concept-momentum')).toHaveText('11');

    // a change dated after the anchor does not count yet: gamma 15 from 2026-04-01 leaves momentum 11
    await page.getByTestId(`person-edit-${rowId}`).click();
    await expect(page.getByTestId('person-form-name')).toHaveValue('Ravi');
    await page.getByTestId('person-form-gamma').fill('15');
    await page.getByTestId('person-form-effective-date').fill('2026-04-01');
    await page.getByTestId('person-form-submit').click();
    await expect(ravi.getByTestId('person-history')).toContainText('2026-04-01 gamma 15');
    await expect(ravi.getByTestId('concept-momentum')).toHaveText('11');

    await page.getByTestId('sheet-id-input').fill('S1');
    await page.getByTestId('sheet-load').click();
    await expect(page.getByTestId(/^person-row-\d+$/)).toHaveCount(2);
    await expect(page.getByTestId('person-row-2').getByTestId('person-name')).toHaveText('Ravi');
    await expect(page.getByTestId('person-row-2').getByTestId('person-alpha')).toHaveText('4');
    await expect(page.getByTestId('person-row-2').getByTestId('concept-momentum')).toHaveText('11');

    // as of 2026-05-01 Ravi's gamma 15 counts: thrust 8, drift 15-4 = 11, momentum 8 + 3*11 = 41
    await page.getByTestId('sheet-as-of').fill('2026-05-01');
    await page.getByTestId('sheet-as-of-apply').click();
    await expect(page.getByTestId('person-row-2').getByTestId('concept-momentum')).toHaveText('41');
  });

  test('an alpha change on one sheet shows on every sheet the person is on', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      anchor: '2026-03-01',
      sheets: [
        { id: 'S1', anchor: '2026-03-01', people: [
          { id: 1, name: 'Dana', alpha: 3,  beta: 4,  gamma: 10 },             // momentum 33
          { id: 2, name: 'Ravi', alpha: 7,  beta: 2,  gamma: 5 },              // momentum 8
          { id: 9, name: 'Hela', alpha: 10, beta: 30, gamma: 10, hold: true }, // momentum 300, held
        ] },
        { id: 'S2', anchor: '2026-03-01', people: [
          { id: 1, name: 'Uma', alpha: 5, beta: 20, gamma: 5 },                // momentum 100
        ] },
      ],
      shares: [{ sheetId: 'S2', personId: 7, fromSheetId: 'S1', fromPersonId: 1 }], // Dana on S2 as 7
    });
    await page.goto('/');
    await page.getByTestId('sheet-id-input').fill('S2');
    await page.getByTestId('sheet-load').click();

    await expect(page.getByTestId(/^person-row-\d+$/)).toHaveCount(2);
    await expect(page.getByTestId('person-row-7').getByTestId('person-name')).toHaveText('Dana');
    await expect(page.getByTestId('person-row-7').getByTestId('person-alpha')).toHaveText('3');
    await expect(page.getByTestId('person-row-7').getByTestId('concept-momentum')).toHaveText('33');

    // alpha 8 -> thrust 32, drift 10-8 = 2, momentum 32 + 3*2 = 38
    await page.getByTestId('person-edit-7').click();
    await expect(page.getByTestId('person-form-name')).toHaveValue('Dana');
    await page.getByTestId('person-form-alpha').fill('8');
    await page.getByTestId('person-form-submit').click();
    await expect(page.getByTestId('person-row-7').getByTestId('person-alpha')).toHaveText('8');
    await expect(page.getByTestId('person-row-7').getByTestId('concept-momentum')).toHaveText('38');

    // a change dated after the anchor does not count yet: gamma 20 from 2026-04-01 leaves momentum 38
    await page.getByTestId('person-edit-7').click();
    await expect(page.getByTestId('person-form-name')).toHaveValue('Dana');
    await page.getByTestId('person-form-gamma').fill('20');
    await page.getByTestId('person-form-effective-date').fill('2026-04-01');
    await page.getByTestId('person-form-submit').click();
    await expect(page.getByTestId('person-row-7').getByTestId('person-history')).toContainText('2026-04-01 gamma 20');
    await expect(page.getByTestId('person-row-7').getByTestId('concept-momentum')).toHaveText('38');

    await page.getByTestId('sheet-id-input').fill('S1');
    await page.getByTestId('sheet-load').click();
    await expect(page.getByTestId('person-row-1').getByTestId('person-alpha')).toHaveText('8');
    await expect(page.getByTestId('person-row-1').getByTestId('concept-momentum')).toHaveText('38');
    // on S1: Dana 38 is rank 1 and the leader, Ravi 8 is rank 2 (Hela 300 is on hold)
    await expect(page.getByTestId('person-row-1').getByTestId('concept-rank')).toHaveText('1');
    await expect(page.getByTestId('rollup-leader')).toHaveText('Dana');

    // as of 2026-05-01 Dana's gamma 20 counts: thrust 32, drift 20-8 = 12, momentum 32 + 3*12 = 68
    await page.getByTestId('sheet-as-of').fill('2026-05-01');
    await page.getByTestId('sheet-as-of-apply').click();
    await expect(page.getByTestId('person-row-1').getByTestId('concept-momentum')).toHaveText('68');
  });

  test('state is kept separately on each sheet', { tag: '@functionality' }, async ({ page }) => {
    // with no links or score, adjusted = momentum; scaled = adjusted * band multiplier
    // S1 sets band D's multiplier to 2 (C stays 2)
    await resetAndSeed({
      anchor: '2026-03-01',
      sheets: [
        { id: 'S1', anchor: '2026-03-01', settings: { bandMultipliers: { A: 4, B: 3, C: 2, D: 2, E: 0 } }, people: [
          { id: 1, name: 'Dana', alpha: 5,  beta: 20, gamma: 5,  active: true, state: 'REVIEW' },            // momentum 100, band C, scaled 200
          { id: 9, name: 'Hela', alpha: 5, beta: 15, gamma: 5, active: true, state: 'FINAL', hold: true }, // momentum 75, band D, scaled 150, held
        ] },
        { id: 'S2', anchor: '2026-03-01', people: [
          { id: 1, name: 'Uma', alpha: 2, beta: 3, gamma: 5, active: true, state: 'FINAL' },                 // momentum 6 + 9 = 15, band D, scaled 15
        ] },
      ],
      shares: [{ sheetId: 'S2', personId: 7, fromSheetId: 'S1', fromPersonId: 1 }], // Dana on S2 as 7, no state given
    });
    await page.goto('/');
    await page.getByTestId('sheet-id-input').fill('S2');
    await page.getByTestId('sheet-load').click();

    // Dana starts at DRAFT on S2, whatever her state on S1
    await expect(page.getByTestId('person-row-7').getByTestId('person-state')).toHaveText('DRAFT');
    // rollup-final-total: Uma 15 = 15; leave out the highest contribution, Uma's 15 -> 0
    await expect(page.getByTestId('rollup-final-total')).toHaveText('0');

    await page.getByTestId('person-advance-7').click();
    await expect(page.getByTestId('person-row-7').getByTestId('person-state')).toHaveText('REVIEW');
    // rollup-final-total: Uma 15 = 15; leave out the highest contribution, Uma's 15 -> 0
    await expect(page.getByTestId('rollup-final-total')).toHaveText('0');

    await page.getByTestId('sheet-id-input').fill('S1');
    await page.getByTestId('sheet-load').click();
    await expect(page.getByTestId('person-row-1').getByTestId('person-state')).toHaveText('REVIEW');
    // rollup-final-total: Hela 75 (half of 150) = 75; leave out the highest contribution, Hela's 75 -> 0
    await expect(page.getByTestId('rollup-final-total')).toHaveText('0');

    await page.getByTestId('person-advance-1').click();
    await expect(page.getByTestId('person-row-1').getByTestId('person-state')).toHaveText('FINAL');
    // rollup-final-total: Dana 200 + Hela 75 (half of 150) = 275; leave out the highest contribution, Dana's 200 -> 75
    await expect(page.getByTestId('rollup-final-total')).toHaveText('75');
    // a change dated after the anchor does not count yet: Hela's beta 30 from 2026-04-01 leaves 75
    await page.getByTestId('person-edit-9').click();
    await expect(page.getByTestId('person-form-name')).toHaveValue('Hela');
    await page.getByTestId('person-form-beta').fill('30');
    await page.getByTestId('person-form-effective-date').fill('2026-04-01');
    await page.getByTestId('person-form-submit').click();
    await expect(page.getByTestId('person-row-9').getByTestId('person-history')).toContainText('2026-04-01 beta 30');
    await expect(page.getByTestId('rollup-final-total')).toHaveText('75');
    // as of 2026-05-01 Hela's beta 30 counts: momentum 150, band C, scaled 300, half 150;
    // Dana 200 + 150 = 350, Dana's 200 left out -> 150
    await page.getByTestId('sheet-as-of').fill('2026-05-01');
    await page.getByTestId('sheet-as-of-apply').click();
    await expect(page.getByTestId('rollup-final-total')).toHaveText('150');
    await page.getByTestId('sheet-as-of-clear').click();
    await expect(page.getByTestId('rollup-final-total')).toHaveText('75');

    await page.getByTestId('sheet-id-input').fill('S2');
    await page.getByTestId('sheet-load').click();
    await expect(page.getByTestId('person-row-7').getByTestId('person-state')).toHaveText('REVIEW');
    // rollup-final-total: Uma 15 = 15; leave out the highest contribution, Uma's 15 -> 0
    await expect(page.getByTestId('rollup-final-total')).toHaveText('0');
  });
});
