import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// kind is one of A, B, C. verge derives from it: A=1, B=2, C=4.
const SEED = {
  people: [
    { id: 1, name: 'Ada', alpha: 2, beta: 3,  gamma: 5, delta: 3, epsilon: 4,  zeta: 10, kind: 'A' },
    { id: 2, name: 'Ben', alpha: 4, beta: 2,  gamma: 1, delta: 5, epsilon: 2,  zeta: 1,  kind: 'B' },
    { id: 3, name: 'Dot', alpha: 5, beta: 20, gamma: 5, delta: 5, epsilon: 20, zeta: 5,  kind: 'C' },
  ],
};

test.describe('verge', () => {
  test('verge comes from kind', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed(SEED);
    await page.goto('/');
    await page.getByTestId('nav-worksheet').click();

    await expect(page.getByTestId('person-row-1').getByTestId('person-kind')).toHaveText('A');
    await expect(page.getByTestId('person-row-1').getByTestId('concept-verge')).toHaveText('1');
    await expect(page.getByTestId('person-row-2').getByTestId('concept-verge')).toHaveText('2');
    await expect(page.getByTestId('person-row-3').getByTestId('concept-verge')).toHaveText('4');
  });
});
