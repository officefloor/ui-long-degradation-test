import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// Each sheet owns its band boundaries and band multipliers. A sheet starts with the usual ones:
// D from 0, C from 100, B from 250, A from 500 (below D's start is E), multipliers A 4, B 3, C 2,
// D 1, E 0. The settings panel shows them in sheet-setting-band-from-D|C|B|A and
// sheet-setting-band-mult-A|B|C|D|E, and sheet-settings-save stores them for the open sheet.
// band, scaled, the band counts, norm and the final total all use the sheet's values.
// With no patrons, follows or score and everyone active, adjusted = momentum = alpha*beta when
// gamma = alpha.

test.describe('band settings per sheet', () => {
  test('changing a boundary and a multiplier moves band, scaled, counts, norm and final total', { tag: '@functionality' }, async ({ page }) => {
    // Hela is on hold: left out of sheet-wide figures (the band counts and the middle scaled), and
    // the final total counts her scaled at half, rounded to the nearest (a half rounds up)
    // Sol is shared from sheet S9 as row 8 and counted here like anyone: adjusted 150, DRAFT here.
    // A change dated after the anchor does not count yet: Ann's beta 10 from 2026-04-01.
    await resetAndSeed({
      anchor: '2026-03-01',
      people: [
        { id: 1, name: 'Ann',  alpha: 5,  beta: 8,  gamma: 5,  active: true, state: 'FINAL' }, // adjusted 40
        { id: 2, name: 'Bo',   alpha: 6,  beta: 20, gamma: 6,  active: true, state: 'FINAL' }, // adjusted 120
        { id: 3, name: 'Cy',   alpha: 11, beta: 20, gamma: 11, active: true, state: 'FINAL' }, // adjusted 220
        { id: 4, name: 'Di',   alpha: 10, beta: 30, gamma: 10, active: true, state: 'DRAFT' }, // adjusted 300
        { id: 5, name: 'Ed',   alpha: 3,  beta: 1,  gamma: 0,  active: true, state: 'DRAFT' }, // adjusted 3 + 3*-3 = -6
        { id: 9, name: 'Hela', alpha: 5,  beta: 7,  gamma: 5,  active: true, state: 'FINAL', hold: true }, // adjusted 35
      ],
      sheets: [
        { id: 'S9', people: [
          { id: 1, name: 'Sol', alpha: 5, beta: 30, gamma: 5, active: true, state: 'DRAFT' },
        ] },
      ],
      shares: [{ personId: 8, fromSheetId: 'S9', fromPersonId: 1 }],
      history: [{ personId: 1, field: 'beta', value: 10, from: '2026-04-01' }],
    });
    await page.goto('/');

    // the usual values to start with
    //   bands: Ann D, Bo C, Cy C, Di B, Ed E, Hela D, Sol C
    //   scaled: Ann 40*1=40, Bo 120*2=240, Cy 220*2=440, Di 300*3=900, Ed -6*0=0, Hela 35*1=35,
    //           Sol 150*2=300
    //   middle scaled (Hela left out): 0, 40, 240, 300, 440, 900 -> lower middle 240
    //   final total: 40 + 240 + 440 + 35/2 = 17.5 -> 18 -> 738
    await expect(page.getByTestId('sheet-setting-band-from-B')).toHaveValue('250');
    await expect(page.getByTestId('sheet-setting-band-mult-C')).toHaveValue('2');
    await expect(page.getByTestId('person-row-3').getByTestId('concept-band')).toHaveText('C');
    await expect(page.getByTestId('person-row-2').getByTestId('concept-scaled')).toHaveText('240');
    await expect(page.getByTestId('person-row-3').getByTestId('concept-scaled')).toHaveText('440');
    await expect(page.getByTestId('band-count-B')).toHaveText('1'); // Di
    await expect(page.getByTestId('band-count-C')).toHaveText('3'); // Bo, Cy, Sol
    await expect(page.getByTestId('band-count-D')).toHaveText('1'); // Ann (Hela is on hold)
    await expect(page.getByTestId('person-row-3').getByTestId('concept-norm')).toHaveText('200');  // 440-240
    await expect(page.getByTestId('person-row-9').getByTestId('concept-norm')).toHaveText('-205'); // 35-240
    // rollup-final-total: Ann 40 + Bo 240 + Cy 440 + Hela 18 (half of 35) = 738; leave out the highest contribution, Cy's 440 -> 298
    await expect(page.getByTestId('rollup-final-total')).toHaveText('298');

    // B now starts at 200, and C multiplies by 3
    await page.getByTestId('sheet-setting-band-from-B').fill('200');
    await page.getByTestId('sheet-setting-band-mult-C').fill('3');
    await page.getByTestId('sheet-settings-save').click();

    //   bands: Ann D, Bo C, Cy B (220 >= 200), Di B, Ed E, Hela D, Sol C
    //   scaled: Ann 40, Bo 120*3=360, Cy 220*3=660, Di 900, Ed 0, Hela 35, Sol 150*3=450
    //   middle scaled (Hela left out): 0, 40, 360, 450, 660, 900 -> lower middle 360
    //   final total: 40 + 360 + 660 + 18 -> 1078
    await expect(page.getByTestId('person-row-3').getByTestId('concept-band')).toHaveText('B');
    await expect(page.getByTestId('person-row-2').getByTestId('concept-scaled')).toHaveText('360');
    await expect(page.getByTestId('person-row-3').getByTestId('concept-scaled')).toHaveText('660');
    await expect(page.getByTestId('person-row-4').getByTestId('concept-scaled')).toHaveText('900');
    await expect(page.getByTestId('band-count-B')).toHaveText('2'); // Cy, Di
    await expect(page.getByTestId('band-count-C')).toHaveText('2'); // Bo, Sol
    await expect(page.getByTestId('band-count-D')).toHaveText('1'); // Ann (Hela is on hold)
    await expect(page.getByTestId('person-row-1').getByTestId('concept-norm')).toHaveText('-320'); // 40-360
    await expect(page.getByTestId('person-row-3').getByTestId('concept-norm')).toHaveText('300');  // 660-360
    await expect(page.getByTestId('person-row-9').getByTestId('concept-norm')).toHaveText('-325'); // 35-360
    // rollup-final-total: Ann 40 + Bo 360 + Cy 660 + Hela 18 (half of 35) = 1078; leave out the highest contribution, Cy's 660 -> 418
    await expect(page.getByTestId('rollup-final-total')).toHaveText('418');
  });

  test('a sheet with its own band settings classifies differently from a sheet on the usual ones', { tag: '@functionality' }, async ({ page }) => {
    // Sol is shared from sheet S9 onto S1 as row 8 and counted there like anyone: adjusted 30 -> D.
    await resetAndSeed({
      anchor: '2026-03-01',
      sheets: [
        {
          id: 'S1',
          // D from 0, C from 50, B from 150, A from 300; multipliers A 5, B 4, C 3, D 2, E 1
          settings: {
            bandFrom: { D: 0, C: 50, B: 150, A: 300 },
            bandMultipliers: { A: 5, B: 4, C: 3, D: 2, E: 1 },
          },
          people: [
            { id: 1, name: 'Ann',  alpha: 5,  beta: 8,  gamma: 5,  active: true }, // adjusted 40  -> D, 40*2=80
            { id: 2, name: 'Bo',   alpha: 6,  beta: 20, gamma: 6,  active: true }, // adjusted 120 -> C, 120*3=360
            { id: 3, name: 'Cy',   alpha: 11, beta: 20, gamma: 11, active: true }, // adjusted 220 -> B, 220*4=880
            { id: 4, name: 'Di',   alpha: 10, beta: 30, gamma: 10, active: true }, // adjusted 300 -> A, 300*5=1500
            { id: 5, name: 'Ed',   alpha: 3,  beta: 1,  gamma: 0,  active: true }, // adjusted -6  -> E, -6*1=-6
            // Hela is on hold: she shows her own band, but the band counts leave her out
            { id: 9, name: 'Hela', alpha: 5,  beta: 7,  gamma: 5,  active: true, hold: true }, // adjusted 35 -> D, 70
          ],
        },
        {
          id: 'S2',
          people: [
            { id: 1, name: 'Ann',  alpha: 5,  beta: 8,  gamma: 5,  active: true }, // adjusted 40  -> D, 40*1=40
            { id: 2, name: 'Bo',   alpha: 6,  beta: 20, gamma: 6,  active: true }, // adjusted 120 -> C, 120*2=240
            { id: 3, name: 'Cy',   alpha: 11, beta: 20, gamma: 11, active: true }, // adjusted 220 -> C, 220*2=440
            { id: 4, name: 'Di',   alpha: 10, beta: 30, gamma: 10, active: true }, // adjusted 300 -> B, 300*3=900
            { id: 5, name: 'Ed',   alpha: 3,  beta: 1,  gamma: 0,  active: true }, // adjusted -6  -> E, -6*0=0
          ],
        },
        { id: 'S9', people: [
          { id: 1, name: 'Sol', alpha: 3, beta: 10, gamma: 3, active: true },
        ] },
      ],
      shares: [{ sheetId: 'S1', personId: 8, fromSheetId: 'S9', fromPersonId: 1 }],
    });
    await page.goto('/');
    await page.getByTestId('sheet-id-input').fill('S1');
    await page.getByTestId('sheet-load').click();

    await expect(page.getByTestId('sheet-setting-band-from-C')).toHaveValue('50');
    await expect(page.getByTestId('sheet-setting-band-mult-E')).toHaveValue('1');
    await expect(page.getByTestId('person-row-3').getByTestId('concept-band')).toHaveText('B');
    await expect(page.getByTestId('person-row-4').getByTestId('concept-band')).toHaveText('A');
    await expect(page.getByTestId('person-row-1').getByTestId('concept-scaled')).toHaveText('80');
    await expect(page.getByTestId('person-row-3').getByTestId('concept-scaled')).toHaveText('880');
    await expect(page.getByTestId('person-row-4').getByTestId('concept-scaled')).toHaveText('1500');
    await expect(page.getByTestId('person-row-5').getByTestId('concept-scaled')).toHaveText('-6');
    await expect(page.getByTestId('person-row-9').getByTestId('concept-scaled')).toHaveText('70');
    await expect(page.getByTestId('band-count-D')).toHaveText('2'); // Ann, Sol (Hela is on hold)

    await page.getByTestId('sheet-id-input').fill('S2');
    await page.getByTestId('sheet-load').click();

    await expect(page.getByTestId('sheet-setting-band-from-C')).toHaveValue('100');
    await expect(page.getByTestId('sheet-setting-band-mult-E')).toHaveValue('0');
    await expect(page.getByTestId('person-row-3').getByTestId('concept-band')).toHaveText('C');
    await expect(page.getByTestId('person-row-4').getByTestId('concept-band')).toHaveText('B');
    await expect(page.getByTestId('person-row-1').getByTestId('concept-scaled')).toHaveText('40');
    await expect(page.getByTestId('person-row-3').getByTestId('concept-scaled')).toHaveText('440');
    await expect(page.getByTestId('person-row-4').getByTestId('concept-scaled')).toHaveText('900');
    await expect(page.getByTestId('person-row-5').getByTestId('concept-scaled')).toHaveText('0');

    // a change dated after the anchor does not count yet: Cy's beta 30 from 2026-04-01 leaves him C
    await page.getByTestId('person-edit-3').click();
    await page.getByTestId('person-form-beta').fill('30');
    await page.getByTestId('person-form-effective-date').fill('2026-04-01');
    await page.getByTestId('person-form-submit').click();
    await expect(page.getByTestId('person-row-3').getByTestId('concept-band')).toHaveText('C');
    // as of 2026-05-01 Cy's beta 30 counts on S2: adjusted 11*30 = 330 -> B
    await page.getByTestId('sheet-as-of').fill('2026-05-01');
    await page.getByTestId('sheet-as-of-apply').click();
    await expect(page.getByTestId('person-row-3').getByTestId('concept-band')).toHaveText('B');
  });
});
