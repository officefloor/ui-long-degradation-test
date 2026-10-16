import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// (negatives dropped). churn and total tide follow.
//   brace = influence + 2*force: Ben 19, Gus -59 ; Dot's patron is Ben, so
//     influence 108+(-1)=107 and brace 107+2*100=307
//   tide counts the people a person follows and the people who follow them, each once.
//   Averages round to the nearest, a half rounding up: Ada's clout (-1+108)/2 = 53.5 -> 54,
//   so Ada's brace is 123+54+2*12 = 201 ; Ada's vector (-3+200)/2 = 98.5 -> 99.
//   Ada follows Ben(19),Dot(307),Gus(-59 dropped) -> tide 326
//   Ben is followed by Ada(201), Dot(307) -> 508 ; Gus is followed by Ada -> 201
//   Dot follows Ben(19), is followed by Ada(201) -> 220
//   churn: Ada 326-99=227, Dot 220-(-3)=223
// Hela is on hold, so she does not count towards anyone else's figures: Dot follows her and she
// follows Ben, but her brace (1 + 2*5 = 11) is left out of their tide. Her own tide counts Ben and
// Dot: 19+307 = 326, at half in the total: 163.
//   total 326+508+220+201+163 = 1418
// Sol is shared from sheet S9 as row 8 and counted here like anyone: Sol follows Ben, so Sol's tide
// is Ben's 19 and Sol's brace (1 + 2*2 = 5) joins Ben's tide: 508 + 5 = 513.
// A change dated after the anchor does not count yet: Dot's beta 40 from 2026-04-01.

test.describe('tide positive only', () => {
  test('tide counts only positive followed brace', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
  anchor: '2026-03-01',
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
    { from: 1, to: 2 }, { from: 1, to: 3 }, { from: 1, to: 4 },
    { from: 3, to: 2 }, { from: 3, to: 9 },
    { from: 9, to: 2 },
    { from: 8, to: 2 },
  ],
  sheets: [
    { id: 'S9', people: [
      { id: 1, name: 'Sol', alpha: 1, beta: 1, gamma: 1, delta: 1, epsilon: 2, zeta: 1, active: true },
    ] },
  ],
  shares: [{ personId: 8, fromSheetId: 'S9', fromPersonId: 1 }],
  history: [{ personId: 3, field: 'beta', value: 40, from: '2026-04-01' }],
});
    await page.goto('/');

    await expect(page.getByTestId('person-row-1').getByTestId('concept-tide')).toHaveText('326');
    await expect(page.getByTestId('person-row-3').getByTestId('concept-tide')).toHaveText('220');

    await expect(page.getByTestId('person-row-1').getByTestId('concept-churn')).toHaveText('227');
    await expect(page.getByTestId('person-row-3').getByTestId('concept-churn')).toHaveText('223');

    // rollup-total-tide: Ada 326 + Ben 513 + Dot 220 + Gus 201 + Hela 163 (half of 326) + Sol 19 = 1442; leave out the highest contribution, Ben's 513 -> 929
    await expect(page.getByTestId('rollup-total-tide')).toHaveText('929');
  });
});
