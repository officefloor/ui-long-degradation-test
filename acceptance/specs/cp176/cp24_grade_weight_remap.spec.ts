import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

test.describe('grade weight remapped', () => {
  test('wider weights change load and total load', { tag: '@functionality' }, async ({ page }) => {
    // the sheet's own LOW weight is 2 (MID and HIGH keep 3 and 5)
    // Sol is shared from sheet S9: counted here like anyone (momentum 10, LOW load 20)
    // a change dated after the anchor does not count yet (Uma's beta 40 from 2026-04-01)
    await resetAndSeed({
      anchor: '2026-03-01',
      settings: { gradeWeights: { LOW: 2 } },
      sheets: [
        { id: 'S9', people: [{ id: 1, name: 'Sol', alpha: 2, beta: 5, gamma: 2, grade: 'LOW' }] },
      ],
      shares: [{ personId: 8, fromSheetId: 'S9', fromPersonId: 1 }],
      history: [{ personId: 3, field: 'beta', value: 40, from: '2026-04-01' }],
      people: [
        { id: 1, name: 'Dana', alpha: 3, beta: 4,  gamma: 10,   grade: 'HIGH' }, // weight 5, load 33*5=165
        { id: 2, name: 'Ravi', alpha: 7, beta: 2,  gamma: 5,    grade: 'MID' },  // weight 3, load 8*3=24
        { id: 3, name: 'Uma',  alpha: 5, beta: 20, gamma: 5,    grade: 'LOW' },  // weight 2, load 100*2=200
        { id: 4, name: 'Gap',  alpha: 3, beta: 4,  gamma: null, grade: 'HIGH' }, // gamma 0: momentum 3, load 3*5=15
        { id: 9, name: 'Hela', alpha: 5, beta: 5,  gamma: 5,    grade: 'LOW', hold: true },  // on hold: load 25*2 = 50, counted at 50/2 = 25
      ],
    });
    await page.goto('/');

    await expect(page.getByTestId('person-row-1').getByTestId('concept-weight')).toHaveText('5');
    await expect(page.getByTestId('person-row-2').getByTestId('concept-weight')).toHaveText('3');
    await expect(page.getByTestId('person-row-3').getByTestId('concept-weight')).toHaveText('2');

    await expect(page.getByTestId('person-row-1').getByTestId('concept-load')).toHaveText('165');
    await expect(page.getByTestId('person-row-2').getByTestId('concept-load')).toHaveText('24');
    await expect(page.getByTestId('person-row-3').getByTestId('concept-load')).toHaveText('200');

    await expect(page.getByTestId('rollup-total-load')).toHaveText('449'); // 165 + 24 + 200 + 15 + 25 + Sol 20
  });
});
