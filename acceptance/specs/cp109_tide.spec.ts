import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// tide = total of the brace of the people a person follows and of the people who follow them, each
// person once (0 if none).
//   brace = influence + 2*force. Ben and Gus have no patrons, so influence is their momentum:
//     Ben -1+2*10=19, Gus 1+2*(-30)=-59
//   Dot's patron is Ben: net 100+8=108, clout -1 -> influence 107 ; brace 107+2*100=307
//   follows: Ada -> Ben,Dot,Gus,Sol ; Dot -> Ben,Hela ; Hela -> Ben
//   Ada's brace: momentum 15, patrons Ben, Dot -> backing 8+100 = 108, net 123, effective 123,
//     clout (-1+108)/2 = 53, influence 123+53 = 176 ; force 12 ; brace 176 + 2*12 = 200
//   tide: Ada follows Ben, Dot, Gus, Sol -> 19+307-59+30 = 297
//         Ben is followed by Ada, Dot -> 200+307 = 507
//         Dot follows Ben, is followed by Ada -> 19+200 = 219
//         Gus is followed by Ada -> 200
// Hela is on hold, so she does not count towards anyone else's figures: Dot follows her and she
// follows Ben, but her brace (1 + 2*5 = 11) is left out of Dot's and Ben's tide.

test.describe('tide', () => {
  test('tide sums the followed brace', { tag: '@functionality' }, async ({ page }) => {
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

    await expect(page.getByTestId('person-row-1').getByTestId('concept-tide')).toHaveText('297');
    await expect(page.getByTestId('person-row-2').getByTestId('concept-tide')).toHaveText('507');
    await expect(page.getByTestId('person-row-3').getByTestId('concept-tide')).toHaveText('219');
    await expect(page.getByTestId('person-row-4').getByTestId('concept-tide')).toHaveText('200');
  });
});
