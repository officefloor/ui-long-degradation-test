import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// State belongs to each sheet a person is on; their name, numbers and other values stay shared.
// Moving a shared person forward, back or into rework on one sheet leaves their state on every other
// sheet alone, and each sheet's final total counts them only when they are FINAL on that sheet. A
// person put onto another sheet starts at DRAFT there, whatever their state elsewhere.
//
// Seed: a share may carry the person's state on that sheet, `shares: [{ ..., state }]`. A share
// without a state starts at DRAFT. The person's own row in `people` holds their state on the sheet
// they came from.
//
// With no links or score, adjusted = momentum; scaled = adjusted * band multiplier.
// Hela is on hold: left out of sheet-wide figures (totals count her at half).
test.describe('state per sheet', () => {
  test('each sheet keeps its own state for a shared person', { tag: '@functionality' }, async ({ page }) => {
    // S1 sets band D's multiplier to 2 (C stays 2)
    await resetAndSeed({
      anchor: '2026-03-01',
      sheets: [
        { id: 'S1', settings: { bandMultipliers: { A: 4, B: 3, C: 2, D: 2, E: 0 } }, people: [
          { id: 1, name: 'Dana', alpha: 5,  beta: 20, gamma: 5,  active: true, state: 'FINAL' },              // momentum 100, band C, scaled 200
          { id: 2, name: 'Ravi', alpha: 7,  beta: 2,  gamma: 5,  active: true, state: 'FINAL' },              // momentum 8, band D, scaled 16
          { id: 9, name: 'Hela', alpha: 5,  beta: 15, gamma: 5,  active: true, state: 'FINAL', hold: true },  // momentum 75, band D, scaled 150, held
        ] },
        { id: 'S2', people: [
          { id: 1, name: 'Kai', alpha: 2, beta: 3, gamma: 5, active: true, state: 'FINAL' },                  // momentum 15, band D, scaled 15
        ] },
        { id: 'S3', people: [] },
      ],
      shares: [
        { sheetId: 'S2', personId: 5, fromSheetId: 'S1', fromPersonId: 1, state: 'REVIEW' }, // Dana on S2 as 5
        { sheetId: 'S3', personId: 1, fromSheetId: 'S1', fromPersonId: 1 },                  // Dana on S3 as 1
      ],
    });
    await page.goto('/');
    await page.getByTestId('sheet-id-input').fill('S2');
    await page.getByTestId('sheet-load').click();

    await expect(page.getByTestId('person-row-5').getByTestId('person-state')).toHaveText('REVIEW');
    // rollup-final-total: Kai 15 = 15; leave out the highest contribution, Kai's 15 -> 0
    await expect(page.getByTestId('rollup-final-total')).toHaveText('0');

    await page.getByTestId('person-advance-5').click();
    await expect(page.getByTestId('person-row-5').getByTestId('person-state')).toHaveText('FINAL');
    // rollup-final-total: Kai 15 + Dana 200 = 215; leave out the highest contribution, Dana's 200 -> 15
    await expect(page.getByTestId('rollup-final-total')).toHaveText('15');

    await page.getByTestId('sheet-id-input').fill('S1');
    await page.getByTestId('sheet-load').click();
    await expect(page.getByTestId('person-row-1').getByTestId('person-state')).toHaveText('FINAL');
    // rollup-final-total: Dana 200 + Ravi 16 + Hela 75 (half of 150) = 291; leave out the highest contribution, Dana's 200 -> 91
    await expect(page.getByTestId('rollup-final-total')).toHaveText('91');
    // a change dated after the anchor does not count yet: Ravi's beta 20 from 2026-04-01 leaves 91
    await page.getByTestId('person-edit-2').click();
    await page.getByTestId('person-form-beta').fill('20');
    await page.getByTestId('person-form-effective-date').fill('2026-04-01');
    await page.getByTestId('person-form-submit').click();
    await expect(page.getByTestId('rollup-final-total')).toHaveText('91');
    // as of 2026-05-01 Ravi's beta 20 counts: momentum 7*20 + 3*(5-7) = 134, band C, scaled 268;
    // 200 + 268 + 75 = 543, Ravi's 268 left out -> 275
    await page.getByTestId('sheet-as-of').fill('2026-05-01');
    await page.getByTestId('sheet-as-of-apply').click();
    await expect(page.getByTestId('rollup-final-total')).toHaveText('275');
    await page.getByTestId('sheet-as-of-clear').click();

    await page.getByTestId('person-rework-1').click();
    await expect(page.getByTestId('person-row-1').getByTestId('person-state')).toHaveText('REWORK');
    // rollup-final-total: Ravi 16 + Hela 75 (half of 150) = 91; leave out the highest contribution, Hela's 75 -> 16
    await expect(page.getByTestId('rollup-final-total')).toHaveText('16');

    await page.getByTestId('sheet-id-input').fill('S2');
    await page.getByTestId('sheet-load').click();
    await expect(page.getByTestId('person-row-5').getByTestId('person-state')).toHaveText('FINAL');
    // rollup-final-total: Kai 15 + Dana 200 = 215; leave out the highest contribution, Dana's 200 -> 15
    await expect(page.getByTestId('rollup-final-total')).toHaveText('15');

    // the share onto S3 carries no state, so she is DRAFT there
    await page.getByTestId('sheet-id-input').fill('S3');
    await page.getByTestId('sheet-load').click();
    await expect(page.getByTestId('person-row-1').getByTestId('person-name')).toHaveText('Dana');
    await expect(page.getByTestId('person-row-1').getByTestId('person-state')).toHaveText('DRAFT');
  });

  test('a person added from another sheet starts at DRAFT there', { tag: '@functionality' }, async ({ page }) => {
    // S1 sets band D's multiplier to 2 (C stays 2)
    await resetAndSeed({
      anchor: '2026-03-01',
      sheets: [
        { id: 'S1', settings: { bandMultipliers: { A: 4, B: 3, C: 2, D: 2, E: 0 } }, people: [
          { id: 1, name: 'Dana', alpha: 5,  beta: 20, gamma: 5,  active: true, state: 'FINAL' },              // scaled 200
          { id: 9, name: 'Hela', alpha: 5,  beta: 15, gamma: 5,  active: true, state: 'FINAL', hold: true },  // scaled 150, held
        ] },
        { id: 'S2', people: [] },
      ],
    });
    await page.goto('/');
    await page.getByTestId('sheet-id-input').fill('S2');
    await page.getByTestId('sheet-load').click();

    await page.getByTestId('person-share-select').selectOption({ label: 'S1: Dana' });
    await page.getByTestId('person-share-add').click();

    await expect(page.getByTestId(/^person-row-/)).toHaveCount(1);
    const dana = page.getByTestId(/^person-row-/).first();
    await expect(dana.getByTestId('person-name')).toHaveText('Dana');
    await expect(dana.getByTestId('person-state')).toHaveText('DRAFT');

    const rowId = (await dana.getAttribute('data-testid'))!.replace('person-row-', '');
    await page.getByTestId(`person-advance-${rowId}`).click();
    await expect(dana.getByTestId('person-state')).toHaveText('REVIEW');

    await page.getByTestId('sheet-id-input').fill('S1');
    await page.getByTestId('sheet-load').click();
    await expect(page.getByTestId('person-row-1').getByTestId('person-state')).toHaveText('FINAL');
    // rollup-final-total: Dana 200 + Hela 75 (half of 150) = 275; leave out the highest contribution, Dana's 200 -> 75
    await expect(page.getByTestId('rollup-final-total')).toHaveText('75');
    // a change dated after the anchor does not count yet: Hela's beta 30 from 2026-04-01 leaves 75
    await page.getByTestId('person-edit-9').click();
    await page.getByTestId('person-form-beta').fill('30');
    await page.getByTestId('person-form-effective-date').fill('2026-04-01');
    await page.getByTestId('person-form-submit').click();
    await expect(page.getByTestId('rollup-final-total')).toHaveText('75');
    // as of 2026-05-01 Hela's beta 30 counts: momentum 150, band C, scaled 300, half 150;
    // 200 + 150 = 350, Dana's 200 left out -> 150
    await page.getByTestId('sheet-as-of').fill('2026-05-01');
    await page.getByTestId('sheet-as-of-apply').click();
    await expect(page.getByTestId('rollup-final-total')).toHaveText('150');
  });
});
