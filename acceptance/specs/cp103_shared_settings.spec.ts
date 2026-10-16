import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// Each sheet's settings apply to everyone on it, shared people included: a shared person's reach,
// weight, load, band and scaled on a sheet use THAT sheet's region multipliers, band boundaries, band
// multipliers and grade weights. Their regions and grade are shared with the person.
//
// Dana: momentum 100 + 3*0 = 100; no links or score, so adjusted = 100. Regions N1 and S2, grade MID.
//   S1 (N 2, S 3; C from 100, C x2; MID 3): reach 100*2 + 100*3 = 500, band C, scaled 200, load 300
//   S2 (N 4, S 2; B from 100, B x3; MID 2): reach 100*4 + 100*2 = 600, band B, scaled 300, load 200
// Hela is on hold: left out of sheet-wide figures such as the band counts (adjusted 120, band B on S2).
test.describe('settings for shared people', () => {
  test('a shared person\'s figures use the settings of the sheet they are shown on', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      sheets: [
        { id: 'S1',
          people: [{ id: 1, name: 'Dana', alpha: 5, beta: 20, gamma: 5, grade: 'MID', active: true }],
          regions: [{ personId: 1, region: 'N1' }, { personId: 1, region: 'S2' }],
          settings: { regionMultipliers: { N: 2, S: 3, other: 1 },
                      bandFrom: { D: 0, C: 100, B: 250, A: 500 },
                      bandMultipliers: { A: 4, B: 3, C: 2, D: 1, E: 0 },
                      gradeWeights: { LOW: 1, MID: 3, HIGH: 5 } } },
        { id: 'S2',
          people: [{ id: 9, name: 'Hela', alpha: 6, beta: 20, gamma: 6, grade: 'LOW', active: true, hold: true }], // momentum 120, held
          settings: { regionMultipliers: { N: 4, S: 2, other: 1 },
                      bandFrom: { D: 0, C: 50, B: 100, A: 300 },
                      bandMultipliers: { A: 5, B: 3, C: 2, D: 1, E: 0 },
                      gradeWeights: { LOW: 1, MID: 2, HIGH: 4 } } },
      ],
      shares: [{ sheetId: 'S2', personId: 4, fromSheetId: 'S1', fromPersonId: 1 }], // Dana on S2 as 4
    });
    await page.goto('/');
    await page.getByTestId('sheet-id-input').fill('S1');
    await page.getByTestId('sheet-load').click();

    const s1Dana = page.getByTestId('person-row-1');
    await expect(s1Dana.getByTestId('concept-reach')).toHaveText('500');
    await expect(s1Dana.getByTestId('concept-weight')).toHaveText('3');
    await expect(s1Dana.getByTestId('concept-load')).toHaveText('300');   // 100 * 3
    await expect(s1Dana.getByTestId('concept-band')).toHaveText('C');
    await expect(s1Dana.getByTestId('concept-scaled')).toHaveText('200'); // 100 * 2
    await expect(page.getByTestId('band-count-C')).toHaveText('1');

    await page.getByTestId('sheet-id-input').fill('S2');
    await page.getByTestId('sheet-load').click();

    const s2Dana = page.getByTestId('person-row-4');
    await expect(s2Dana.getByTestId('person-region')).toHaveText('N1, S2');
    await expect(s2Dana.getByTestId('concept-reach')).toHaveText('600');
    await expect(s2Dana.getByTestId('concept-weight')).toHaveText('2');
    await expect(s2Dana.getByTestId('concept-load')).toHaveText('200');   // 100 * 2
    await expect(s2Dana.getByTestId('concept-band')).toHaveText('B');
    await expect(s2Dana.getByTestId('concept-scaled')).toHaveText('300'); // 100 * 3
    // Dana is the only band B person counted here (Hela is on hold)
    await expect(page.getByTestId('band-count-B')).toHaveText('1');
  });

  test('changing one sheet\'s settings changes a shared person only on that sheet', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      sheets: [
        { id: 'S1',
          people: [{ id: 1, name: 'Dana', alpha: 5, beta: 20, gamma: 5, grade: 'MID', active: true }],
          regions: [{ personId: 1, region: 'N1' }, { personId: 1, region: 'S2' }],
          settings: { regionMultipliers: { N: 2, S: 3, other: 1 } } },
        { id: 'S2',
          people: [{ id: 9, name: 'Hela', alpha: 6, beta: 20, gamma: 6, grade: 'LOW', active: true, hold: true }],
          settings: { regionMultipliers: { N: 4, S: 2, other: 1 } } },
      ],
      shares: [{ sheetId: 'S2', personId: 4, fromSheetId: 'S1', fromPersonId: 1 }],
    });
    await page.goto('/');
    await page.getByTestId('sheet-id-input').fill('S2');
    await page.getByTestId('sheet-load').click();
    await expect(page.getByTestId('person-row-4').getByTestId('concept-reach')).toHaveText('600');

    await page.getByTestId('sheet-setting-region-N').fill('1');
    await page.getByTestId('sheet-settings-save').click();
    // S2 now N 1, S 2: 100*1 + 100*2 = 300
    await expect(page.getByTestId('person-row-4').getByTestId('concept-reach')).toHaveText('300');

    await page.getByTestId('sheet-id-input').fill('S1');
    await page.getByTestId('sheet-load').click();
    // S1 is unchanged (N 2, S 3): 100*2 + 100*3 = 500
    await expect(page.getByTestId('sheet-setting-region-N')).toHaveValue('2');
    await expect(page.getByTestId('person-row-1').getByTestId('concept-reach')).toHaveText('500');
  });
});
