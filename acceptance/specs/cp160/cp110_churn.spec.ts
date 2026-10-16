import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// churn = tide - vector ; tide counts the positive brace of the people a person follows and of the
// people who follow them, each once. Averages round to the nearest, a half rounding up:
//   Ada's clout (-1+108)/2 = 53.5 -> 54, influence 123+54 = 177, brace 177+2*12 = 201
//   vector: Ada (-3+200)/2 = 98.5 -> 99, Dot -3 ; brace: Ben 19, Dot 307, Gus -59
//   Ada follows Ben, Dot, Gus -> 19+307 = 326 -> churn 326-99 = 227
//   Ben followed by Ada, Dot -> 201+307 = 508 -> churn 508
//   Dot follows Ben, followed by Ada -> 19+201 = 220 -> churn 220+3 = 223
//   Gus followed by Ada -> 201 -> churn 201


// The anchor is 2026-03-01. Dot's beta becomes 21 from 2026-04-01: a change dated after the anchor does not count yet.
test.describe('churn', () => {
  test('churn is tide minus vector', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
  anchor: '2026-03-01',
  people: [
    { id: 1, name: 'Ada', alpha: 2, beta: 3,  gamma: 5, delta: 3,  epsilon: 4,   zeta: 10, active: true },
    { id: 2, name: 'Ben', alpha: 4, beta: 2,  gamma: 1, delta: 5,  epsilon: 2,   zeta: 1,  active: true },
    { id: 3, name: 'Dot', alpha: 5, beta: 20, gamma: 5, delta: 5,  epsilon: 20,  zeta: 5,  active: true },
    { id: 4, name: 'Gus', alpha: 1, beta: 1,  gamma: 1, delta: 1,  epsilon: -30, zeta: 1,  active: true },
  ],
  patrons: [
    { personId: 1, patronId: 2 }, { personId: 1, patronId: 3 },
    { personId: 3, patronId: 2 },
  ],
  follows: [
    { from: 1, to: 2 }, { from: 1, to: 3 }, { from: 1, to: 4 },
    { from: 3, to: 2 },
  ],
  history: [{ personId: 3, field: 'beta', value: 21, from: '2026-04-01' }],
});
    await page.goto('/');

    await expect(page.getByTestId('person-row-1').getByTestId('concept-churn')).toHaveText('227'); // positive braces 19 + 307 = 326, minus vector 99
    await expect(page.getByTestId('person-row-2').getByTestId('concept-churn')).toHaveText('508');
    await expect(page.getByTestId('person-row-3').getByTestId('concept-churn')).toHaveText('223');
    await expect(page.getByTestId('person-row-4').getByTestId('concept-churn')).toHaveText('201');
  });
});
