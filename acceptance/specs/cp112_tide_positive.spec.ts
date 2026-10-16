import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// (negatives dropped). churn and total tide follow.
//   brace = influence + 2*force: Ben 19, Gus -59 ; Dot's patron is Ben, so
//     influence 108+(-1)=107 and brace 107+2*100=307
//   tide counts the people a person follows and the people who follow them, each once.
//   Ada's brace is 200.
//   Ada follows Ben(19),Dot(307),Gus(-59 dropped),Sol(30) -> tide 356
//   Ben is followed by Ada(200), Dot(307) -> 507 ; Gus and Sol are each followed by Ada -> 200
//   Dot follows Ben(19), is followed by Ada(200) -> 219
//   churn: Ada 356-98=258, Dot 219-(-3)=222
// Hela is on hold, so she does not count towards anyone else's figures: Dot follows her and she
// follows Ben, but her brace (1 + 2*5 = 11) is left out of their tide. Her own tide counts Ben and
// Dot: 19+307 = 326, at half in the total: 163.
//   total 356+507+219+200+200+163 = 1645

test.describe('tide positive only', () => {
  test('tide counts only positive followed brace', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
  people: [
    { id: 1, name: 'Ada', alpha: 2, beta: 3,  gamma: 5, delta: 3,  epsilon: 4,   zeta: 10, active: true },
    { id: 2, name: 'Ben', alpha: 4, beta: 2,  gamma: 1, delta: 5,  epsilon: 2,   zeta: 1,  active: true },
    { id: 3, name: 'Dot', alpha: 5, beta: 20, gamma: 5, delta: 5,  epsilon: 20,  zeta: 5,  active: true },
    { id: 4, name: 'Gus', alpha: 1, beta: 1,  gamma: 1, delta: 1,  epsilon: -30, zeta: 1,  active: true },
    { id: 9, name: 'Hela', alpha: 1, beta: 1,  gamma: 1, delta: 1,  epsilon: 5,   zeta: 1,  active: true, hold: true },
  ],
  patrons: [
    { personId: 1, patronId: 2 }, { personId: 1, patronId: 3 },
    { personId: 3, patronId: 2 },
  ],
  follows: [
    { from: 1, to: 2 }, { from: 1, to: 3 }, { from: 1, to: 4 }, { from: 1, to: 8 },
    { from: 3, to: 2 }, { from: 3, to: 9 },
    { from: 9, to: 2 },
  ],
  // Sol is shared from sheet S9 as row 8: counted here like anyone (brace 10 + 2*10 = 30), and Ada follows her
  sheets: [{ id: 'S9', people: [
    { id: 1, name: 'Sol', alpha: 2, beta: 5, gamma: 2, delta: 2, epsilon: 5, zeta: 2, active: true },
  ] }],
  shares: [{ personId: 8, fromSheetId: 'S9', fromPersonId: 1 }],
});
    await page.goto('/');

    await expect(page.getByTestId('person-row-1').getByTestId('concept-tide')).toHaveText('356');
    await expect(page.getByTestId('person-row-3').getByTestId('concept-tide')).toHaveText('219');

    await expect(page.getByTestId('person-row-1').getByTestId('concept-churn')).toHaveText('258');
    await expect(page.getByTestId('person-row-3').getByTestId('concept-churn')).toHaveText('222');

    await expect(page.getByTestId('rollup-total-tide')).toHaveText('1645');
  });
});
