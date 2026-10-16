import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';


// Ranks are dense: level momentum shares a rank and the next rank follows on. Cy 100 -> 1; Bob and
// Ann 50 -> 2; Sol 30 -> 3; Di 20 -> 4; Ed 10 -> 5. Hela is on hold: unranked (counted, her 60 would
// come second and push the rest down one).
// Sol is shared from sheet S9: ranked here like anyone.
// A change dated after the anchor does not count yet: Ed's beta 10 from 2026-04-01 (momentum 20,
// level with Di).
test.describe('rank', () => {
  test('rank orders by momentum desc, level momentum shares a rank', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
  anchor: '2026-03-01',
  sheets: [
    { id: 'S9', people: [
      { id: 1, name: 'Sol', alpha: 3, beta: 10, gamma: 3 }, // momentum 30
    ] },
  ],
  shares: [{ personId: 8, fromSheetId: 'S9', fromPersonId: 1 }],
  history: [{ personId: 5, field: 'beta', value: 10, from: '2026-04-01' }],
  people: [
    { id: 1, name: 'Ann', alpha: 2,  beta: 25, gamma: 2 },  // momentum 50, alpha 2
    { id: 2, name: 'Bob', alpha: 10, beta: 5,  gamma: 10 }, // momentum 50, alpha 10
    { id: 3, name: 'Cy',  alpha: 5,  beta: 20, gamma: 5 },  // momentum 100
    { id: 4, name: 'Di',  alpha: 4,  beta: 5,  gamma: 4 },  // momentum 20
    { id: 5, name: 'Ed',  alpha: 2,  beta: 5,  gamma: 2 },  // momentum 10
    { id: 9, name: 'Hela', alpha: 3,  beta: 20, gamma: 3, hold: true }, // momentum 60, on hold: unranked
  ],
});
    await page.goto('/');

    await expect(page.getByTestId('person-row-3').getByTestId('concept-rank')).toHaveText('1');
    await expect(page.getByTestId('person-row-2').getByTestId('concept-rank')).toHaveText('2');
    await expect(page.getByTestId('person-row-1').getByTestId('concept-rank')).toHaveText('2');
    await expect(page.getByTestId('person-row-8').getByTestId('concept-rank')).toHaveText('3');
    await expect(page.getByTestId('person-row-4').getByTestId('concept-rank')).toHaveText('4');
    await expect(page.getByTestId('person-row-5').getByTestId('concept-rank')).toHaveText('5');
    await expect(page.getByTestId('person-row-9').getByTestId('concept-rank')).toHaveText('n/a');
  });
});
