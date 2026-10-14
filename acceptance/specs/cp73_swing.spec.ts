import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// swing = total of the torque of the people a person follows (directed; 0 if none). No patrons here,
// so flux is 0 and crest = blend.
//   torque: Ada 33, Ben -2, Dot 100
//   follows: Ada -> Ben,Dot ; Dot -> Ben ; Ben none
//   swing: Ada -2+100=98, Ben 0, Dot -2

test.describe('swing', () => {
  test('swing sums the followed torque', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
  people: [
    { id: 1, name: 'Ada', alpha: 2, beta: 3,  gamma: 5, delta: 3, epsilon: 4,  zeta: 10 },
    { id: 2, name: 'Ben', alpha: 4, beta: 2,  gamma: 1, delta: 5, epsilon: 2,  zeta: 1 },
    { id: 3, name: 'Dot', alpha: 5, beta: 20, gamma: 5, delta: 5, epsilon: 20, zeta: 5 },
  ],
  follows: [
    { from: 1, to: 2 }, { from: 1, to: 3 },
    { from: 3, to: 2 },
  ],
});
    await page.goto('/');

    await expect(page.getByTestId('person-row-1').getByTestId('concept-swing')).toHaveText('98');
    await expect(page.getByTestId('person-row-2').getByTestId('concept-swing')).toHaveText('0');
    await expect(page.getByTestId('person-row-3').getByTestId('concept-swing')).toHaveText('-2');
  });
});
