import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// Each sheet owns its grade weights. A sheet starts with LOW 1, MID 3, HIGH 5. The settings panel
// shows them in sheet-setting-weight-LOW|MID|HIGH, and sheet-settings-save stores them for the open
// sheet. weight comes from the grade using the sheet's values, load = momentum * weight, and the
// total load adds up everyone's load, skipping anyone whose load cannot be worked out.

test.describe('grade weights per sheet', () => {
  test('changing the weights changes weight, load and total load', { tag: '@functionality' }, async ({ page }) => {
    // Hela is on hold: left out of sheet-wide figures, so the total load counts her load at half,
    // rounded down
    await resetAndSeed({
      people: [
        { id: 1, name: 'Dana', alpha: 3, beta: 4,  gamma: 10,   grade: 'HIGH', active: true }, // momentum 12 + 3*7 = 33
        { id: 2, name: 'Ravi', alpha: 7, beta: 2,  gamma: 5,    grade: 'MID',  active: true }, // momentum 14 + 3*-2 = 8
        { id: 3, name: 'Uma',  alpha: 5, beta: 20, gamma: 5,    grade: 'LOW',  active: true }, // momentum 100
        { id: 4, name: 'Gap',  alpha: 3, beta: 4,  gamma: null, grade: 'HIGH', active: true }, // momentum n/a -> load n/a
        { id: 9, name: 'Hela', alpha: 5, beta: 1,  gamma: 6,    grade: 'MID',  active: true, hold: true }, // momentum 5 + 3*1 = 8
      ],
    });
    await page.goto('/');

    // LOW 1, MID 3, HIGH 5 to start with
    //   load: Dana 33*5=165, Ravi 8*3=24, Uma 100*1=100, Hela 8*3=24
    //   total load: 165 + 24 + 100 + 24/2=12 -> 301
    await expect(page.getByTestId('sheet-setting-weight-LOW')).toHaveValue('1');
    await expect(page.getByTestId('sheet-setting-weight-MID')).toHaveValue('3');
    await expect(page.getByTestId('sheet-setting-weight-HIGH')).toHaveValue('5');
    await expect(page.getByTestId('person-row-1').getByTestId('concept-weight')).toHaveText('5');
    await expect(page.getByTestId('person-row-1').getByTestId('concept-load')).toHaveText('165');
    await expect(page.getByTestId('person-row-9').getByTestId('concept-load')).toHaveText('24');
    await expect(page.getByTestId('rollup-total-load')).toHaveText('301');

    // MID becomes 4 and HIGH becomes 8
    await page.getByTestId('sheet-setting-weight-MID').fill('4');
    await page.getByTestId('sheet-setting-weight-HIGH').fill('8');
    await page.getByTestId('sheet-settings-save').click();

    //   load: Dana 33*8=264, Ravi 8*4=32, Uma 100*1=100, Gap n/a, Hela 8*4=32
    //   total load: 264 + 32 + 100 + 32/2=16 -> 412
    await expect(page.getByTestId('person-row-1').getByTestId('concept-weight')).toHaveText('8');
    await expect(page.getByTestId('person-row-2').getByTestId('concept-weight')).toHaveText('4');
    await expect(page.getByTestId('person-row-3').getByTestId('concept-weight')).toHaveText('1');
    await expect(page.getByTestId('person-row-1').getByTestId('concept-load')).toHaveText('264');
    await expect(page.getByTestId('person-row-2').getByTestId('concept-load')).toHaveText('32');
    await expect(page.getByTestId('person-row-3').getByTestId('concept-load')).toHaveText('100');
    await expect(page.getByTestId('person-row-4').getByTestId('concept-load')).toHaveText('n/a');
    await expect(page.getByTestId('person-row-9').getByTestId('concept-load')).toHaveText('32');
    await expect(page.getByTestId('rollup-total-load')).toHaveText('412');
  });

  test('a sheet with its own weights keeps them apart from a sheet on the usual ones', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      sheets: [
        {
          id: 'S1',
          // LOW 2 and HIGH 9 are the sheet's own; MID is not set, so it stays at 3
          settings: { gradeWeights: { LOW: 2, HIGH: 9 } },
          people: [
            { id: 1, name: 'Dana', alpha: 3, beta: 4,  gamma: 10, grade: 'HIGH', active: true }, // 33*9 = 297
            { id: 2, name: 'Ravi', alpha: 7, beta: 2,  gamma: 5,  grade: 'MID',  active: true }, // 8*3 = 24
            { id: 3, name: 'Uma',  alpha: 5, beta: 20, gamma: 5,  grade: 'LOW',  active: true }, // 100*2 = 200
            // Hela is on hold: the total load counts her load at half, rounded down
            { id: 9, name: 'Hela', alpha: 5, beta: 1,  gamma: 6,  grade: 'MID',  active: true, hold: true }, // 8*3 = 24
          ],
        },
        {
          id: 'S2',
          people: [
            { id: 1, name: 'Dana', alpha: 3, beta: 4,  gamma: 10, grade: 'HIGH', active: true }, // 33*5 = 165
            { id: 2, name: 'Ravi', alpha: 7, beta: 2,  gamma: 5,  grade: 'MID',  active: true }, // 8*3 = 24
            { id: 3, name: 'Uma',  alpha: 5, beta: 20, gamma: 5,  grade: 'LOW',  active: true }, // 100*1 = 100
          ],
        },
      ],
    });
    await page.goto('/');
    await page.getByTestId('sheet-id-input').fill('S1');
    await page.getByTestId('sheet-load').click();

    await expect(page.getByTestId('sheet-setting-weight-LOW')).toHaveValue('2');
    await expect(page.getByTestId('sheet-setting-weight-MID')).toHaveValue('3');
    await expect(page.getByTestId('sheet-setting-weight-HIGH')).toHaveValue('9');
    await expect(page.getByTestId('person-row-1').getByTestId('concept-load')).toHaveText('297');
    await expect(page.getByTestId('person-row-2').getByTestId('concept-load')).toHaveText('24');
    await expect(page.getByTestId('person-row-3').getByTestId('concept-load')).toHaveText('200');
    await expect(page.getByTestId('rollup-total-load')).toHaveText('533'); // 297 + 24 + 200 + 24/2=12

    await page.getByTestId('sheet-id-input').fill('S2');
    await page.getByTestId('sheet-load').click();

    await expect(page.getByTestId('person-row-1').getByTestId('concept-weight')).toHaveText('5');
    await expect(page.getByTestId('person-row-1').getByTestId('concept-load')).toHaveText('165');
    await expect(page.getByTestId('person-row-3').getByTestId('concept-load')).toHaveText('100');
    await expect(page.getByTestId('rollup-total-load')).toHaveText('289'); // 165 + 24 + 100
  });
});
