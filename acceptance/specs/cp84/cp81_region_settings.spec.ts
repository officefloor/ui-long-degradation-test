import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// Each sheet owns its region multipliers. A sheet starts with N 3, S 2 and every other first letter
// 1. The settings panel shows the open sheet's values in sheet-setting-region-N, -S and -other, and
// sheet-settings-save stores them for that sheet only. reach = sum over the person's regions of
// momentum * the sheet's multiplier for that region's first letter.
// Seeded `settings.regionMultipliers` gives a sheet its own values; a key left out takes the default.
// A person on hold still shows their own reach, but is left out of the per-region counts.

test.describe('region settings per sheet', () => {
  test('a sheet starts with the default multipliers, and changing them changes reach on that sheet only', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      sheets: [
        {
          id: 'S1',
          people: [
            { id: 1, name: 'Dana', alpha: 3, beta: 4,  gamma: 10, active: true }, // momentum 12 + 3*7 = 33
            { id: 2, name: 'Ravi', alpha: 7, beta: 2,  gamma: 5,  active: true }, // momentum 14 + 3*-2 = 8
            { id: 3, name: 'Uma',  alpha: 5, beta: 20, gamma: 5,  active: true }, // momentum 100
            // Hela is on hold: left out of sheet-wide figures, so N1 counts only Dana
            { id: 9, name: 'Hela', alpha: 2, beta: 5,  gamma: 2,  active: true, hold: true }, // momentum 10
          ],
          regions: [
            { personId: 1, region: 'N1' }, { personId: 2, region: 'S2' },
            { personId: 3, region: 'E5' }, { personId: 9, region: 'N1' },
          ],
        },
        {
          id: 'S2',
          settings: { regionMultipliers: { N: 4, S: 1, other: 2 } },
          people: [
            { id: 1, name: 'Lea', alpha: 2, beta: 5, gamma: 2, active: true }, // momentum 10
            { id: 2, name: 'Moe', alpha: 4, beta: 3, gamma: 4, active: true }, // momentum 12
            { id: 3, name: 'Ned', alpha: 3, beta: 3, gamma: 3, active: true }, // momentum 9
          ],
          regions: [
            { personId: 1, region: 'N1' }, { personId: 2, region: 'S2' }, { personId: 3, region: 'W1' },
          ],
        },
      ],
    });
    await page.goto('/');
    await page.getByTestId('sheet-id-input').fill('S1');
    await page.getByTestId('sheet-load').click();

    // S1 has no settings of its own: N 3, S 2, other 1
    await expect(page.getByTestId('sheet-setting-region-N')).toHaveValue('3');
    await expect(page.getByTestId('sheet-setting-region-S')).toHaveValue('2');
    await expect(page.getByTestId('sheet-setting-region-other')).toHaveValue('1');
    await expect(page.getByTestId('person-row-1').getByTestId('concept-reach')).toHaveText('99');  // 33*3
    await expect(page.getByTestId('person-row-2').getByTestId('concept-reach')).toHaveText('16');  // 8*2
    await expect(page.getByTestId('person-row-3').getByTestId('concept-reach')).toHaveText('100'); // 100*1
    await expect(page.getByTestId('person-row-9').getByTestId('concept-reach')).toHaveText('30');  // 10*3
    await expect(page.getByTestId('region-count-N1')).toHaveText('1'); // Dana (Hela is on hold)

    // set N 5, S 4, other 2 for S1
    await page.getByTestId('sheet-setting-region-N').fill('5');
    await page.getByTestId('sheet-setting-region-S').fill('4');
    await page.getByTestId('sheet-setting-region-other').fill('2');
    await page.getByTestId('sheet-settings-save').click();

    await expect(page.getByTestId('person-row-1').getByTestId('concept-reach')).toHaveText('165'); // 33*5
    await expect(page.getByTestId('person-row-2').getByTestId('concept-reach')).toHaveText('32');  // 8*4
    await expect(page.getByTestId('person-row-3').getByTestId('concept-reach')).toHaveText('200'); // 100*2
    await expect(page.getByTestId('person-row-9').getByTestId('concept-reach')).toHaveText('50');  // 10*5

    // S2 keeps its own values: N 4, S 1, other 2
    await page.getByTestId('sheet-id-input').fill('S2');
    await page.getByTestId('sheet-load').click();
    await expect(page.getByTestId('sheet-setting-region-N')).toHaveValue('4');
    await expect(page.getByTestId('sheet-setting-region-S')).toHaveValue('1');
    await expect(page.getByTestId('sheet-setting-region-other')).toHaveValue('2');
    await expect(page.getByTestId('person-row-1').getByTestId('concept-reach')).toHaveText('40'); // 10*4
    await expect(page.getByTestId('person-row-2').getByTestId('concept-reach')).toHaveText('12'); // 12*1
    await expect(page.getByTestId('person-row-3').getByTestId('concept-reach')).toHaveText('18'); // 9*2

    // back on S1 the saved values are still there
    await page.getByTestId('sheet-id-input').fill('S1');
    await page.getByTestId('sheet-load').click();
    await expect(page.getByTestId('sheet-setting-region-N')).toHaveValue('5');
    await expect(page.getByTestId('sheet-setting-region-S')).toHaveValue('4');
    await expect(page.getByTestId('sheet-setting-region-other')).toHaveValue('2');
    await expect(page.getByTestId('person-row-1').getByTestId('concept-reach')).toHaveText('165'); // 33*5
  });

  test('seeded multipliers apply, and one left out takes the default', { tag: '@functionality' }, async ({ page }) => {
    // N 4 and other 2 are the sheet's own; S is not set, so it stays at the default 2
    await resetAndSeed({
      settings: { regionMultipliers: { N: 4, other: 2 } },
      people: [
        { id: 1, name: 'Dana', alpha: 3, beta: 4,  gamma: 10, active: true }, // momentum 33
        { id: 2, name: 'Ravi', alpha: 7, beta: 2,  gamma: 5,  active: true }, // momentum 8
        { id: 3, name: 'Uma',  alpha: 5, beta: 20, gamma: 5,  active: true }, // momentum 100
        { id: 4, name: 'Kit',  alpha: 2, beta: 5,  gamma: 2,  active: true }, // momentum 10
        // Hela is on hold: left out of sheet-wide figures, so N1 counts Dana and Kit
        { id: 9, name: 'Hela', alpha: 4, beta: 3,  gamma: 4,  active: true, hold: true }, // momentum 12
      ],
      regions: [
        { personId: 1, region: 'N1' }, { personId: 2, region: 'S2' }, { personId: 3, region: 'E5' },
        { personId: 4, region: 'N1' }, { personId: 4, region: 'E7' }, { personId: 9, region: 'N1' },
      ],
    });
    await page.goto('/');

    await expect(page.getByTestId('sheet-setting-region-N')).toHaveValue('4');
    await expect(page.getByTestId('sheet-setting-region-S')).toHaveValue('2');
    await expect(page.getByTestId('sheet-setting-region-other')).toHaveValue('2');

    await expect(page.getByTestId('person-row-1').getByTestId('concept-reach')).toHaveText('132'); // 33*4
    await expect(page.getByTestId('person-row-2').getByTestId('concept-reach')).toHaveText('16');  // 8*2
    await expect(page.getByTestId('person-row-3').getByTestId('concept-reach')).toHaveText('200'); // 100*2
    await expect(page.getByTestId('person-row-4').getByTestId('concept-reach')).toHaveText('60');  // 10*4 + 10*2
    await expect(page.getByTestId('person-row-9').getByTestId('concept-reach')).toHaveText('48');  // 12*4
    await expect(page.getByTestId('region-count-N1')).toHaveText('2'); // Dana, Kit (Hela is on hold)
  });
});
