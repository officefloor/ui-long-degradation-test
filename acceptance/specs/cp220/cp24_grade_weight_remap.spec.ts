import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

test.describe('grade weight remapped', () => {
  test('wider weights change load and total load', { tag: '@functionality' }, async ({ page }) => {
    // This sheet weighs LOW 2 (MID 3, HIGH 5 as usual).
    // Sol is shared from sheet S9 as row 8: counted here like anyone (momentum 10, LOW, load 20).
    // A change dated after the anchor does not count yet: Ravi's beta 6 from 2026-04-01.
    await resetAndSeed({
      anchor: '2026-03-01',
      settings: { gradeWeights: { LOW: 2, MID: 3, HIGH: 5 } },
      people: [
        { id: 1, name: 'Dana', alpha: 3, beta: 4,  gamma: 10,   grade: 'HIGH' }, // weight 5, load 33*5=165
        { id: 2, name: 'Ravi', alpha: 7, beta: 2,  gamma: 5,    grade: 'MID' },  // weight 3, load 8*3=24
        { id: 3, name: 'Uma',  alpha: 5, beta: 20, gamma: 5,    grade: 'LOW' },  // weight 2, load 200
        { id: 4, name: 'Gap',  alpha: 3, beta: 4,  gamma: null, grade: 'HIGH' }, // gamma 0: momentum 3, load 3*5=15
        { id: 9, name: 'Hela', alpha: 5, beta: 5,  gamma: 5,    grade: 'LOW', hold: true },  // on hold: load 50, counted at 50/2 = 25
      ],
      sheets: [
        { id: 'S9', people: [
          { id: 1, name: 'Sol', alpha: 2, beta: 5, gamma: 2, grade: 'LOW' },
        ] },
      ],
      shares: [{ personId: 8, fromSheetId: 'S9', fromPersonId: 1 }],
      history: [{ personId: 2, field: 'beta', value: 6, from: '2026-04-01' }],
    });
    await page.goto('/');

    await expect(page.getByTestId('person-row-1').getByTestId('concept-weight')).toHaveText('5');
    await expect(page.getByTestId('person-row-2').getByTestId('concept-weight')).toHaveText('3');
    await expect(page.getByTestId('person-row-3').getByTestId('concept-weight')).toHaveText('2');

    await expect(page.getByTestId('person-row-1').getByTestId('concept-load')).toHaveText('165');
    await expect(page.getByTestId('person-row-2').getByTestId('concept-load')).toHaveText('24');
    await expect(page.getByTestId('person-row-3').getByTestId('concept-load')).toHaveText('200');

    // rollup-total-load: Dana 165 + Ravi 24 + Uma 200 + Gap 15 + Hela 25 (half of 50) + Sol 20 = 449; leave out the highest contribution, Uma's 200 -> 249
    await expect(page.getByTestId('rollup-total-load')).toHaveText('249');
  });
});
