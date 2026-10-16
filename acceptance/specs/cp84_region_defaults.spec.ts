import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// A sheet now starts with region multipliers N 3, S 2 and every other first letter 1. A multiplier
// a sheet already has of its own (seeded `settings.regionMultipliers`, or saved from the settings
// panel) keeps its value; any it does not have uses the new starting value.
// reach = sum over the person's regions of momentum * the sheet's multiplier for that region.
// A person on hold still shows their own reach, but is left out of the per-region counts.

test.describe('new default region multipliers', () => {
  test('a sheet with no multipliers of its own starts at N 3, S 2, other 1', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      sheets: [
        {
          id: 'S1',
          people: [
            { id: 1, name: 'Dana', alpha: 3, beta: 4,  gamma: 10, active: true }, // momentum 12 + 3*7 = 33
            { id: 2, name: 'Ravi', alpha: 7, beta: 2,  gamma: 5,  active: true }, // momentum 14 + 3*-2 = 8
            { id: 3, name: 'Uma',  alpha: 5, beta: 20, gamma: 5,  active: true }, // momentum 100
            { id: 4, name: 'Kit',  alpha: 2, beta: 5,  gamma: 2,  active: true }, // momentum 10
            // Hela is on hold: left out of sheet-wide figures, so N1 counts Dana and Kit
            { id: 9, name: 'Hela', alpha: 2, beta: 5,  gamma: 2,  active: true, hold: true }, // momentum 10
          ],
          regions: [
            { personId: 1, region: 'N1' }, { personId: 2, region: 'S2' }, { personId: 3, region: 'E5' },
            { personId: 4, region: 'N1' }, { personId: 4, region: 'S2' }, { personId: 9, region: 'N1' },
          ],
        },
      ],
    });
    await page.goto('/');
    await page.getByTestId('sheet-id-input').fill('S1');
    await page.getByTestId('sheet-load').click();

    await expect(page.getByTestId('sheet-setting-region-N')).toHaveValue('3');
    await expect(page.getByTestId('sheet-setting-region-S')).toHaveValue('2');
    await expect(page.getByTestId('sheet-setting-region-other')).toHaveValue('1');
    await expect(page.getByTestId('person-row-1').getByTestId('concept-reach')).toHaveText('99');  // 33*3
    await expect(page.getByTestId('person-row-2').getByTestId('concept-reach')).toHaveText('16');  // 8*2
    await expect(page.getByTestId('person-row-3').getByTestId('concept-reach')).toHaveText('100'); // 100*1
    await expect(page.getByTestId('person-row-4').getByTestId('concept-reach')).toHaveText('50');  // 10*3 + 10*2
    await expect(page.getByTestId('person-row-9').getByTestId('concept-reach')).toHaveText('30');  // 10*3
    await expect(page.getByTestId('region-count-N1')).toHaveText('2'); // Dana, Kit (Hela is on hold)

    // a sheet opened for the first time starts with the same values
    await page.getByTestId('sheet-id-input').fill('FRESH');
    await page.getByTestId('sheet-load').click();
    await expect(page.getByTestId('sheet-setting-region-N')).toHaveValue('3');
    await expect(page.getByTestId('sheet-setting-region-S')).toHaveValue('2');
    await expect(page.getByTestId('sheet-setting-region-other')).toHaveValue('1');
  });

  test('multipliers a sheet has of its own keep their values', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      sheets: [
        {
          id: 'S2',
          // N 2 and S 3 are this sheet's own; other is not set, so it is 1
          settings: { regionMultipliers: { N: 2, S: 3 } },
          people: [
            { id: 1, name: 'Lea',  alpha: 2, beta: 5, gamma: 2, active: true }, // momentum 10
            { id: 2, name: 'Moe',  alpha: 4, beta: 3, gamma: 4, active: true }, // momentum 12
            { id: 3, name: 'Ned',  alpha: 3, beta: 3, gamma: 3, active: true }, // momentum 9
            // Hela is on hold: left out of sheet-wide figures, so S2 counts only Moe
            { id: 9, name: 'Hela', alpha: 4, beta: 3, gamma: 4, active: true, hold: true }, // momentum 12
          ],
          regions: [
            { personId: 1, region: 'N1' }, { personId: 2, region: 'S2' },
            { personId: 3, region: 'W1' }, { personId: 9, region: 'S2' },
          ],
        },
        {
          id: 'S3',
          // only N 5 is this sheet's own; S takes the starting value 2, other 1
          settings: { regionMultipliers: { N: 5 } },
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
    await page.getByTestId('sheet-id-input').fill('S2');
    await page.getByTestId('sheet-load').click();

    await expect(page.getByTestId('sheet-setting-region-N')).toHaveValue('2');
    await expect(page.getByTestId('sheet-setting-region-S')).toHaveValue('3');
    await expect(page.getByTestId('sheet-setting-region-other')).toHaveValue('1');
    await expect(page.getByTestId('person-row-1').getByTestId('concept-reach')).toHaveText('20'); // 10*2
    await expect(page.getByTestId('person-row-2').getByTestId('concept-reach')).toHaveText('36'); // 12*3
    await expect(page.getByTestId('person-row-3').getByTestId('concept-reach')).toHaveText('9');  // 9*1
    await expect(page.getByTestId('person-row-9').getByTestId('concept-reach')).toHaveText('36'); // 12*3
    await expect(page.getByTestId('region-count-S2')).toHaveText('1'); // Moe (Hela is on hold)

    await page.getByTestId('sheet-id-input').fill('S3');
    await page.getByTestId('sheet-load').click();

    await expect(page.getByTestId('sheet-setting-region-N')).toHaveValue('5');
    await expect(page.getByTestId('sheet-setting-region-S')).toHaveValue('2');
    await expect(page.getByTestId('sheet-setting-region-other')).toHaveValue('1');
    await expect(page.getByTestId('person-row-1').getByTestId('concept-reach')).toHaveText('50'); // 10*5
    await expect(page.getByTestId('person-row-2').getByTestId('concept-reach')).toHaveText('24'); // 12*2
    await expect(page.getByTestId('person-row-3').getByTestId('concept-reach')).toHaveText('9');  // 9*1
  });
});
