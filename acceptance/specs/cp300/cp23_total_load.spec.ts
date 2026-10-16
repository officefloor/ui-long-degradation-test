import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// A missing number counts as zero, so Gap's missing gamma is 0 and Gap has a load.
// This sheet weighs LOW 2, MID 3, HIGH 5.
// Sol is shared from sheet S9 as row 8: counted here like anyone (momentum 10, LOW, load 20).
// A change dated after the anchor does not count yet: Gap's beta 8 from 2026-04-01.

test.describe('total load', () => {
  test('total load sums computable loads only', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      anchor: '2026-03-01',
      settings: { gradeWeights: { LOW: 2, MID: 3, HIGH: 5 } },
      people: [
        { id: 1, name: 'Dana', alpha: 3, beta: 4,  gamma: 10,   grade: 'HIGH' }, // load 165
        { id: 2, name: 'Ravi', alpha: 7, beta: 2,  gamma: 5,    grade: 'MID' },  // load 24
        { id: 3, name: 'Uma',  alpha: 5, beta: 20, gamma: 5,    grade: 'LOW' },  // load 200
        { id: 4, name: 'Gap',  alpha: 3, beta: 4,  gamma: null, grade: 'HIGH' }, // gamma counts as 0: momentum 12 + 3*(0-3) = 3, load 15
        { id: 9, name: 'Hela', alpha: 5, beta: 5,  gamma: 5,    grade: 'LOW', hold: true },  // on hold: load 50, counted at 50/2 = 25
      ],
      sheets: [
        { id: 'S9', people: [
          { id: 1, name: 'Sol', alpha: 2, beta: 5, gamma: 2, grade: 'LOW' },
        ] },
      ],
      shares: [{ personId: 8, fromSheetId: 'S9', fromPersonId: 1 }],
      history: [{ personId: 4, field: 'beta', value: 8, from: '2026-04-01' }],
    });
    await page.goto('/');

    await expect(page.getByTestId('person-row-4').getByTestId('concept-load')).toHaveText('15');
    // rollup-total-load: Dana 165 + Ravi 24 + Uma 200 + Gap 15 + Hela 25 (half of 50) + Sol 20 = 449; leave out the highest contribution, Uma's 200 -> 249
    await expect(page.getByTestId('rollup-total-load')).toHaveText('249');

    // as of 2026-05-01 Gap's beta 8 counts: momentum 3*8 + 3*(0-3) = 15, load 15*5 = 75
    await page.getByTestId('sheet-as-of').fill('2026-05-01');
    await page.getByTestId('sheet-as-of-apply').click();
    await expect(page.getByTestId('person-row-4').getByTestId('concept-load')).toHaveText('75');
  });
});
