import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// Each sheet owns its grade weights. A sheet starts with LOW 1, MID 3, HIGH 5. The settings panel
// shows them in sheet-setting-weight-LOW|MID|HIGH, and sheet-settings-save stores them for the open
// sheet. weight comes from the grade using the sheet's values, load = momentum * weight, and the
// total load adds up everyone's load, skipping anyone whose load cannot be worked out. A missing
// number counts as zero.

test.describe('grade weights per sheet', () => {
  test('changing the weights changes weight, load and total load', { tag: '@functionality' }, async ({ page }) => {
    // Hela is on hold: left out of sheet-wide figures, so the total load counts her load at half,
    // rounded to the nearest
    // Sol is shared from sheet S9: counted here like anyone (momentum 10, LOW load 10)
    // a change dated after the anchor does not count yet (Uma's beta 40 from 2026-04-01)
    await resetAndSeed({
      anchor: '2026-03-01',
      sheets: [
        { id: 'S9', people: [{ id: 1, name: 'Sol', alpha: 2, beta: 5, gamma: 2, grade: 'LOW', active: true }] },
      ],
      shares: [{ personId: 8, fromSheetId: 'S9', fromPersonId: 1 }],
      history: [{ personId: 3, field: 'beta', value: 40, from: '2026-04-01' }],
      people: [
        { id: 1, name: 'Dana', alpha: 3, beta: 4,  gamma: 10,   grade: 'HIGH', active: true }, // momentum 12 + 3*7 = 33
        { id: 2, name: 'Ravi', alpha: 7, beta: 2,  gamma: 5,    grade: 'MID',  active: true }, // momentum 14 + 3*-2 = 8
        { id: 3, name: 'Uma',  alpha: 5, beta: 20, gamma: 5,    grade: 'LOW',  active: true }, // momentum 100
        { id: 4, name: 'Gap',  alpha: 3, beta: 4,  gamma: null, grade: 'HIGH', active: true }, // gamma 0: momentum 12 + 3*(0-3) = 3
        { id: 9, name: 'Hela', alpha: 5, beta: 1,  gamma: 6,    grade: 'MID',  active: true, hold: true }, // momentum 5 + 3*1 = 8
      ],
    });
    await page.goto('/');

    // LOW 1, MID 3, HIGH 5 to start with
    //   load: Dana 33*5=165, Ravi 8*3=24, Uma 100*1=100, Gap 3*5=15, Hela 8*3=24, Sol 10*1=10
    //   total load: 165 + 24 + 100 + 15 + 24/2=12 + 10 -> 326
    await expect(page.getByTestId('sheet-setting-weight-LOW')).toHaveValue('1');
    await expect(page.getByTestId('sheet-setting-weight-MID')).toHaveValue('3');
    await expect(page.getByTestId('sheet-setting-weight-HIGH')).toHaveValue('5');
    await expect(page.getByTestId('person-row-1').getByTestId('concept-weight')).toHaveText('5');
    await expect(page.getByTestId('person-row-1').getByTestId('concept-load')).toHaveText('165');
    await expect(page.getByTestId('person-row-9').getByTestId('concept-load')).toHaveText('24');
    await expect(page.getByTestId('rollup-total-load')).toHaveText('326');

    // MID becomes 4 and HIGH becomes 8
    await page.getByTestId('sheet-setting-weight-MID').fill('4');
    await page.getByTestId('sheet-setting-weight-HIGH').fill('8');
    await page.getByTestId('sheet-settings-save').click();

    //   load: Dana 33*8=264, Ravi 8*4=32, Uma 100*1=100, Gap 3*8=24, Hela 8*4=32, Sol 10*1=10
    //   total load: 264 + 32 + 100 + 24 + 32/2=16 + 10 -> 446
    await expect(page.getByTestId('person-row-1').getByTestId('concept-weight')).toHaveText('8');
    await expect(page.getByTestId('person-row-2').getByTestId('concept-weight')).toHaveText('4');
    await expect(page.getByTestId('person-row-3').getByTestId('concept-weight')).toHaveText('1');
    await expect(page.getByTestId('person-row-1').getByTestId('concept-load')).toHaveText('264');
    await expect(page.getByTestId('person-row-2').getByTestId('concept-load')).toHaveText('32');
    await expect(page.getByTestId('person-row-3').getByTestId('concept-load')).toHaveText('100');
    await expect(page.getByTestId('person-row-4').getByTestId('concept-load')).toHaveText('24');
    await expect(page.getByTestId('person-row-9').getByTestId('concept-load')).toHaveText('32');
    await expect(page.getByTestId('rollup-total-load')).toHaveText('446');
  });

  test('a sheet with its own weights keeps them apart from a sheet on the usual ones', { tag: '@functionality' }, async ({ page }) => {
    // The sheet that opens first has its own weights; S2 is on the usual ones.
    // Sol is shared from sheet S9: counted here like anyone (momentum 10, LOW 2 -> load 20)
    // a change dated after the anchor does not count yet (Uma's beta 40 from 2026-04-01); Dana's beta
    // was 2 until it became 4 on 2026-02-01
    await resetAndSeed({
      anchor: '2026-03-01',
      // LOW 2 and HIGH 9 are the sheet's own; MID is not set, so it stays at 3
      settings: { gradeWeights: { LOW: 2, HIGH: 9 } },
      people: [
        { id: 1, name: 'Dana', alpha: 3, beta: 2,  gamma: 10, grade: 'HIGH', active: true }, // beta 4 from 2026-02-01: 33*9 = 297
        { id: 2, name: 'Ravi', alpha: 7, beta: 2,  gamma: 5,  grade: 'MID',  active: true }, // 8*3 = 24
        { id: 3, name: 'Uma',  alpha: 5, beta: 20, gamma: 5,  grade: 'LOW',  active: true }, // 100*2 = 200
        // Hela is on hold: the total load counts her load at half, rounded to the nearest
        { id: 9, name: 'Hela', alpha: 5, beta: 1,  gamma: 6,  grade: 'MID',  active: true, hold: true }, // 8*3 = 24
      ],
      history: [
        { personId: 1, field: 'beta', value: 4, from: '2026-02-01' },
        { personId: 3, field: 'beta', value: 40, from: '2026-04-01' },
      ],
      sheets: [
        {
          id: 'S2',
          people: [
            { id: 1, name: 'Dana', alpha: 3, beta: 4,  gamma: 10, grade: 'HIGH', active: true }, // 33*5 = 165
            { id: 2, name: 'Ravi', alpha: 7, beta: 2,  gamma: 5,  grade: 'MID',  active: true }, // 8*3 = 24
            { id: 3, name: 'Uma',  alpha: 5, beta: 20, gamma: 5,  grade: 'LOW',  active: true }, // 100*1 = 100
          ],
        },
        { id: 'S9', people: [{ id: 1, name: 'Sol', alpha: 2, beta: 5, gamma: 2, grade: 'LOW', active: true }] },
      ],
      shares: [{ personId: 8, fromSheetId: 'S9', fromPersonId: 1 }],
    });
    await page.goto('/');

    await expect(page.getByTestId('sheet-setting-weight-LOW')).toHaveValue('2');
    await expect(page.getByTestId('sheet-setting-weight-MID')).toHaveValue('3');
    await expect(page.getByTestId('sheet-setting-weight-HIGH')).toHaveValue('9');
    await expect(page.getByTestId('person-row-1').getByTestId('concept-load')).toHaveText('297');
    await expect(page.getByTestId('person-row-2').getByTestId('concept-load')).toHaveText('24');
    await expect(page.getByTestId('person-row-3').getByTestId('concept-load')).toHaveText('200');
    await expect(page.getByTestId('rollup-total-load')).toHaveText('553'); // 297 + 24 + 200 + 24/2=12 + Sol 20

    // as of 2026-01-15 Dana's beta is still 2: momentum 6 + 21 = 27, load 27*9 = 243, total 553 - 54 = 499
    await page.getByTestId('sheet-as-of').fill('2026-01-15');
    await page.getByTestId('sheet-as-of-apply').click();
    await expect(page.getByTestId('rollup-total-load')).toHaveText('499');
    await page.getByTestId('sheet-as-of-clear').click();

    await page.getByTestId('sheet-id-input').fill('S2');
    await page.getByTestId('sheet-load').click();

    await expect(page.getByTestId('person-row-1').getByTestId('concept-weight')).toHaveText('5');
    await expect(page.getByTestId('person-row-1').getByTestId('concept-load')).toHaveText('165');
    await expect(page.getByTestId('person-row-3').getByTestId('concept-load')).toHaveText('100');
    await expect(page.getByTestId('rollup-total-load')).toHaveText('289'); // 165 + 24 + 100
  });
});
