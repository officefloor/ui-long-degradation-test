import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// MUTATIVE (mutates cp77, cp78, cp79): verge remapped to A=2, B=3, C=5. pivot and total pivot follow.
//   verge: 2, 3, 5 ; pivot: 33*2=66, -2*3=-6, 100*5=500 ; total 66-6+500=560
// Updated cp77/cp78/cp79 ship under acceptance/specs/cp80/.
const SEED = {
  people: [
    { id: 1, name: 'Ada', alpha: 2, beta: 3,  gamma: 5, delta: 3, epsilon: 4,  zeta: 10, kind: 'A' },
    { id: 2, name: 'Ben', alpha: 4, beta: 2,  gamma: 1, delta: 5, epsilon: 2,  zeta: 1,  kind: 'B' },
    { id: 3, name: 'Dot', alpha: 5, beta: 20, gamma: 5, delta: 5, epsilon: 20, zeta: 5,  kind: 'C' },
  ],
};

test.describe('verge remapped', () => {
  test('wider verge changes pivot and total pivot', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed(SEED);
    await page.goto('/');
    await page.getByTestId('nav-worksheet').click();

    await expect(page.getByTestId('person-row-1').getByTestId('concept-verge')).toHaveText('2');
    await expect(page.getByTestId('person-row-2').getByTestId('concept-verge')).toHaveText('3');
    await expect(page.getByTestId('person-row-3').getByTestId('concept-verge')).toHaveText('5');

    await expect(page.getByTestId('person-row-1').getByTestId('concept-pivot')).toHaveText('66');
    await expect(page.getByTestId('person-row-2').getByTestId('concept-pivot')).toHaveText('-6');
    await expect(page.getByTestId('person-row-3').getByTestId('concept-pivot')).toHaveText('500');

    await expect(page.getByTestId('rollup-total-pivot')).toHaveText('560');
  });
});
