import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// churn = tide - vector. vector = average of patrons' blend.
//   Sol is shared from sheet S9 as row 8 and is Gus's patron on this sheet: thrust 10, effective 10,
//   blend 10 + 10 = 20.
//   vector: Ada (−3+200)/2=98, Ben 0, Dot -3, Gus 20/1=20
//   Gus brace: net 1+10=11, clout 10, influence 21, force -30 -> 21 + 2*(-30) = -39
//   tide counts the people a person follows and the people who follow them, each once:
//     Ada follows Ben 19, Dot 307 (net 108, clout -1, influence 107, +2*100), Gus -39 -> 287
//     Ben is followed by Ada (brace 200) and Dot (307) -> 507
//     Dot follows Ben 19, is followed by Ada 200 -> 219 ; Gus is followed by Ada -> 200
//   churn: Ada 287-98=189, Ben 507-0=507, Dot 219-(-3)=222, Gus 200-20=180
// Hela is on hold, so she counts towards nobody's patron or follow figures. She is Ada's patron with
//   blend 1 + 9 = 10; counting her would give Ada vector (-3+200+10)/3 = 69 and churn 287-69 = 218.

test.describe('churn', () => {
  test('churn is tide minus vector', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
  people: [
    { id: 1, name: 'Ada', alpha: 2, beta: 3,  gamma: 5, delta: 3,  epsilon: 4,   zeta: 10, active: true },
    { id: 2, name: 'Ben', alpha: 4, beta: 2,  gamma: 1, delta: 5,  epsilon: 2,   zeta: 1,  active: true },
    { id: 3, name: 'Dot', alpha: 5, beta: 20, gamma: 5, delta: 5,  epsilon: 20,  zeta: 5,  active: true },
    { id: 4, name: 'Gus', alpha: 1, beta: 1,  gamma: 1, delta: 1,  epsilon: -30, zeta: 1,  active: true },
    { id: 9, name: 'Hela', alpha: 1, beta: 1,  gamma: 1, delta: 1,  epsilon: 9,   zeta: 1,  active: true, hold: true },
  ],
  patrons: [
    { personId: 1, patronId: 2 }, { personId: 1, patronId: 3 },
    { personId: 3, patronId: 2 },
    { personId: 1, patronId: 9 },
    { personId: 4, patronId: 8 },
  ],
  follows: [
    { from: 1, to: 2 }, { from: 1, to: 3 }, { from: 1, to: 4 },
    { from: 3, to: 2 },
  ],
  sheets: [{ id: 'S9', people: [
    { id: 1, name: 'Sol', alpha: 2, beta: 5, gamma: 2, delta: 2, epsilon: 5, zeta: 2, active: true },
  ] }],
  shares: [{ personId: 8, fromSheetId: 'S9', fromPersonId: 1 }],
});
    await page.goto('/');

    await expect(page.getByTestId('person-row-1').getByTestId('concept-churn')).toHaveText('189');
    await expect(page.getByTestId('person-row-2').getByTestId('concept-churn')).toHaveText('507');
    await expect(page.getByTestId('person-row-3').getByTestId('concept-churn')).toHaveText('222');
    await expect(page.getByTestId('person-row-4').getByTestId('concept-churn')).toHaveText('180');
  });
});
