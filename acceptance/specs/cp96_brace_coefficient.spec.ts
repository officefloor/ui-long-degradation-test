import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// top brace is still Dot, so cp95 is unaffected.
//   brace: Ada 15+24=39, Ben -1+20=19, Dot 100+200=300 ; total 39+19+300=358

test.describe('brace coefficient raised to 2', () => {
  test('brace = influence + 2*force; total follows', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
  people: [
    { id: 1, name: 'Ada', alpha: 2, beta: 3,  gamma: 5, delta: 3, epsilon: 4,  zeta: 10, active: true },
    { id: 2, name: 'Ben', alpha: 4, beta: 2,  gamma: 1, delta: 5, epsilon: 2,  zeta: 1,  active: true },
    { id: 3, name: 'Dot', alpha: 5, beta: 20, gamma: 5, delta: 5, epsilon: 20, zeta: 5,  active: true },
  ],
});
    await page.goto('/');

    await expect(page.getByTestId('person-row-1').getByTestId('concept-brace')).toHaveText('39');
    await expect(page.getByTestId('person-row-2').getByTestId('concept-brace')).toHaveText('19');
    await expect(page.getByTestId('person-row-3').getByTestId('concept-brace')).toHaveText('300');

    await expect(page.getByTestId('rollup-total-brace')).toHaveText('358');
  });
});
