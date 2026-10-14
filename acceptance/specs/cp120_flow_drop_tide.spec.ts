import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// MUTATIVE (mutates cp117, cp118): flow drops tide — flow = yield + charge. grand flow follows.
// top flow is still Dot, so cp119 is unaffected.
//   flow: Ada 162+260=422, Ben -6-6=-12, Dot 1700+1697=3397 ; grand 422-12+3397=3807
// Updated cp117/cp118 ship under acceptance/specs/cp120/.
const SEED = {
  people: [
    { id: 1, name: 'Ada', alpha: 2, beta: 3,  gamma: 5, delta: 3, epsilon: 4,  zeta: 10, kind: 'A', active: true },
    { id: 2, name: 'Ben', alpha: 4, beta: 2,  gamma: 1, delta: 5, epsilon: 2,  zeta: 1,  kind: 'B', active: true },
    { id: 3, name: 'Dot', alpha: 5, beta: 20, gamma: 5, delta: 5, epsilon: 20, zeta: 5,  kind: 'C', active: true },
  ],
  patrons: [
    { personId: 1, patronId: 2 }, { personId: 1, patronId: 3 },
    { personId: 3, patronId: 2 },
  ],
  follows: [
    { from: 1, to: 2 }, { from: 1, to: 3 },
    { from: 3, to: 2 },
  ],
};

test.describe('flow drops tide', () => {
  test('flow = yield + charge; grand follows', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed(SEED);
    await page.goto('/');
    await page.getByTestId('nav-worksheet').click();

    await expect(page.getByTestId('person-row-1').getByTestId('concept-flow')).toHaveText('422');
    await expect(page.getByTestId('person-row-2').getByTestId('concept-flow')).toHaveText('-12');
    await expect(page.getByTestId('person-row-3').getByTestId('concept-flow')).toHaveText('3397');

    await expect(page.getByTestId('rollup-grand-flow')).toHaveText('3807');
  });
});
