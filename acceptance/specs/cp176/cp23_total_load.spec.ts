import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// A missing number counts as zero, so Gap's missing gamma is 0 and Gap has a load.

test.describe('total load', () => {
  test('total load sums computable loads only', { tag: '@functionality' }, async ({ page }) => {
    // the sheet's own weights (LOW 2, MID 4, HIGH 6) set the loads
    // Sol is shared from sheet S9: counted here like anyone (momentum 10, LOW load 20)
    // a change dated after the anchor does not count yet (Uma's beta 40 from 2026-04-01)
    await resetAndSeed({
      anchor: '2026-03-01',
      settings: { gradeWeights: { LOW: 2, MID: 4, HIGH: 6 } },
      sheets: [
        { id: 'S9', people: [{ id: 1, name: 'Sol', alpha: 2, beta: 5, gamma: 2, grade: 'LOW' }] },
      ],
      shares: [{ personId: 8, fromSheetId: 'S9', fromPersonId: 1 }],
      history: [{ personId: 3, field: 'beta', value: 40, from: '2026-04-01' }],
      people: [
        { id: 1, name: 'Dana', alpha: 3, beta: 4,  gamma: 10,   grade: 'HIGH' }, // load 33*6 = 198
        { id: 2, name: 'Ravi', alpha: 7, beta: 2,  gamma: 5,    grade: 'MID' },  // load 8*4 = 32
        { id: 3, name: 'Uma',  alpha: 5, beta: 20, gamma: 5,    grade: 'LOW' },  // load 100*2 = 200
        { id: 4, name: 'Gap',  alpha: 3, beta: 4,  gamma: null, grade: 'HIGH' }, // gamma counts as 0: momentum 12 + 3*(0-3) = 3, load 3*6 = 18
        { id: 9, name: 'Hela', alpha: 5, beta: 5,  gamma: 5,    grade: 'LOW', hold: true },  // on hold: load 25*2 = 50, counted at 50/2 = 25
      ],
    });
    await page.goto('/');

    await expect(page.getByTestId('person-row-4').getByTestId('concept-load')).toHaveText('18');
    await expect(page.getByTestId('rollup-total-load')).toHaveText('493'); // 198 + 32 + 200 + 18 + 25 + Sol 20
  });
});
