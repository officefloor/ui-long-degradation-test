import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// MUTATIVE (mutates cp73, cp74, cp75): swing now counts only the POSITIVE torque among followed
// people (negatives dropped). haul and total haul follow.
//   swing: Ada (drop Ben -2, keep Dot 100)=100, Ben 0, Dot (drop Ben -2)=0
//   haul: Ada 48+100=148, Ben -3, Dot 200+0=200 ; total 148-3+200=345
// Updated cp73/cp74/cp75 ship under acceptance/specs/cp76/.
const SEED = {
  people: [
    { id: 1, name: 'Ada', alpha: 2, beta: 3,  gamma: 5, delta: 3, epsilon: 4,  zeta: 10 },
    { id: 2, name: 'Ben', alpha: 4, beta: 2,  gamma: 1, delta: 5, epsilon: 2,  zeta: 1 },
    { id: 3, name: 'Dot', alpha: 5, beta: 20, gamma: 5, delta: 5, epsilon: 20, zeta: 5 },
  ],
  follows: [
    { from: 1, to: 2 }, { from: 1, to: 3 },
    { from: 3, to: 2 },
  ],
};

test.describe('swing positive only', () => {
  test('swing counts only positive followed torque', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed(SEED);
    await page.goto('/');
    await page.getByTestId('nav-worksheet').click();

    await expect(page.getByTestId('person-row-1').getByTestId('concept-swing')).toHaveText('100');
    await expect(page.getByTestId('person-row-2').getByTestId('concept-swing')).toHaveText('0');
    await expect(page.getByTestId('person-row-3').getByTestId('concept-swing')).toHaveText('0');

    await expect(page.getByTestId('person-row-1').getByTestId('concept-haul')).toHaveText('148');
    await expect(page.getByTestId('person-row-2').getByTestId('concept-haul')).toHaveText('-3');
    await expect(page.getByTestId('person-row-3').getByTestId('concept-haul')).toHaveText('200');

    await expect(page.getByTestId('rollup-total-haul')).toHaveText('345');
  });
});
