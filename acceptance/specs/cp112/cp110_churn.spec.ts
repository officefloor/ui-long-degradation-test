import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// churn = tide - vector ; tide counts the positive brace of the people a person follows and of the
// people who follow them, each once. brace: Ada 200, Ben 19, Dot 307, Gus -59 ; vector: Ada 98, Dot -3
//   Ada follows Ben, Dot, Gus -> 19+307 = 326 -> churn 326-98 = 228
//   Ben followed by Ada, Dot -> 200+307 = 507 -> churn 507
//   Dot follows Ben, followed by Ada -> 19+200 = 219 -> churn 219+3 = 222
//   Gus followed by Ada -> 200 -> churn 200


test.describe('churn', () => {
  test('churn is tide minus vector', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
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
});
    await page.goto('/');

    await expect(page.getByTestId('person-row-1').getByTestId('concept-churn')).toHaveText('228'); // positive braces 19 + 307 = 326, minus vector 98
    await expect(page.getByTestId('person-row-2').getByTestId('concept-churn')).toHaveText('507');
    await expect(page.getByTestId('person-row-3').getByTestId('concept-churn')).toHaveText('222');
    await expect(page.getByTestId('person-row-4').getByTestId('concept-churn')).toHaveText('200');
  });
});
