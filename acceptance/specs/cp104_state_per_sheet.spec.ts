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
    await resetAndSeed({
      sheets: [
        { id: 'S1',
          // S1's own band multipliers: B 4, C 3, D 1
          settings: { bandMultipliers: { A: 5, B: 4, C: 3, D: 1, E: 0 } },
          people: [
            { id: 1, name: 'Dana', alpha: 5,  beta: 20, gamma: 5,  active: true, state: 'FINAL' },              // momentum 100, band C, scaled 300 here, 200 on S2
            { id: 2, name: 'Ravi', alpha: 7,  beta: 2,  gamma: 5,  active: true, state: 'FINAL' },              // momentum 8, band D, scaled 8
            { id: 9, name: 'Hela', alpha: 10, beta: 30, gamma: 10, active: true, state: 'FINAL', hold: true },  // momentum 300, band B, scaled 1200, held
          ] },
        { id: 'S2',
          // S2's own band multipliers: C 2, D 2
          settings: { bandMultipliers: { A: 4, B: 3, C: 2, D: 2, E: 0 } },
          people: [
            { id: 1, name: 'Kai', alpha: 2, beta: 3, gamma: 5, active: true, state: 'FINAL' },                  // momentum 15, band D, scaled 30
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
    await expect(page.getByTestId('rollup-final-total')).toHaveText('30'); // Kai only

    await page.getByTestId('person-advance-5').click();
    await expect(page.getByTestId('person-row-5').getByTestId('person-state')).toHaveText('FINAL');
    await expect(page.getByTestId('rollup-final-total')).toHaveText('230'); // Kai 30 + Dana 100*2 = 200

    await page.getByTestId('sheet-id-input').fill('S1');
    await page.getByTestId('sheet-load').click();
    await expect(page.getByTestId('person-row-1').getByTestId('person-state')).toHaveText('FINAL');
    // with S1's multipliers: Dana 100*3 = 300 + Ravi 8 + Hela 300*4 = 1200 counted at half (600) = 908
    await expect(page.getByTestId('rollup-final-total')).toHaveText('908');

    await page.getByTestId('person-rework-1').click();
    await expect(page.getByTestId('person-row-1').getByTestId('person-state')).toHaveText('REWORK');
    await expect(page.getByTestId('rollup-final-total')).toHaveText('608'); // Ravi 8 + Hela 600

    await page.getByTestId('sheet-id-input').fill('S2');
    await page.getByTestId('sheet-load').click();
    await expect(page.getByTestId('person-row-5').getByTestId('person-state')).toHaveText('FINAL');
    await expect(page.getByTestId('rollup-final-total')).toHaveText('230');

    // the share onto S3 carries no state, so she is DRAFT there
    await page.getByTestId('sheet-id-input').fill('S3');
    await page.getByTestId('sheet-load').click();
    await expect(page.getByTestId('person-row-1').getByTestId('person-name')).toHaveText('Dana');
    await expect(page.getByTestId('person-row-1').getByTestId('person-state')).toHaveText('DRAFT');
  });

  test('a person added from another sheet starts at DRAFT there', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      sheets: [
        { id: 'S1',
          // S1's own band multipliers: B 4, C 3
          settings: { bandMultipliers: { A: 5, B: 4, C: 3, D: 1, E: 0 } },
          people: [
            { id: 1, name: 'Dana', alpha: 5,  beta: 20, gamma: 5,  active: true, state: 'FINAL' },              // band C, scaled 100*3 = 300
            { id: 9, name: 'Hela', alpha: 10, beta: 30, gamma: 10, active: true, state: 'FINAL', hold: true },  // band B, scaled 300*4 = 1200, held
          ] },
        { id: 'S2', people: [] },
      ],
    });
    await page.goto('/');
    await page.getByTestId('sheet-id-input').fill('S2');
    await page.getByTestId('sheet-load').click();
    await expect(page.getByTestId('sheet-current-id')).toHaveText('S2');

    await page.getByTestId('person-share-select').selectOption({ label: 'S1: Dana' });
    await page.getByTestId('person-share-add').click();

    await expect(page.getByTestId(/^person-row-\d+$/)).toHaveCount(1);
    const dana = page.getByTestId(/^person-row-\d+$/).first();
    await expect(dana.getByTestId('person-name')).toHaveText('Dana');
    await expect(dana.getByTestId('person-state')).toHaveText('DRAFT');

    const rowId = (await dana.getAttribute('data-testid'))!.replace('person-row-', '');
    await page.getByTestId(`person-advance-${rowId}`).click();
    await expect(dana.getByTestId('person-state')).toHaveText('REVIEW');

    await page.getByTestId('sheet-id-input').fill('S1');
    await page.getByTestId('sheet-load').click();
    await expect(page.getByTestId('person-row-1').getByTestId('person-state')).toHaveText('FINAL');
    // Dana 300 + Hela 1200 counted at half (600) = 900
    await expect(page.getByTestId('rollup-final-total')).toHaveText('900');
  });
});
