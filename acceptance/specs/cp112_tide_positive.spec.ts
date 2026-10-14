import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// MUTATIVE (mutates cp109, cp110, cp111): tide now counts only POSITIVE brace among followed people
// (negatives dropped). churn and total tide follow.
//   Ada follows Ben(19),Dot(300),Gus(-59 dropped) -> tide 319 ; Dot follows Ben(19) -> 19
//   churn: Ada 319-98=221, Dot 19-(-3)=22 ; total 319+0+19+0=338
// Updated cp109/cp110/cp111 ship under acceptance/specs/cp112/.
const SEED = {
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
};

test.describe('tide positive only', () => {
  test('tide counts only positive followed brace', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed(SEED);
    await page.goto('/');
    await page.getByTestId('nav-worksheet').click();

    await expect(page.getByTestId('person-row-1').getByTestId('concept-tide')).toHaveText('319');
    await expect(page.getByTestId('person-row-3').getByTestId('concept-tide')).toHaveText('19');

    await expect(page.getByTestId('person-row-1').getByTestId('concept-churn')).toHaveText('221');
    await expect(page.getByTestId('person-row-3').getByTestId('concept-churn')).toHaveText('22');

    await expect(page.getByTestId('rollup-total-tide')).toHaveText('338');
  });
});
