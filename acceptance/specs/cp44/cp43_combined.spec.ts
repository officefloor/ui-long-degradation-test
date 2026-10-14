import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../../support/seed';

// UPDATED PRIOR shipped by cp44 (mutates cp43). combined = influence + synergy, synergy now directed.
const SEED = {
  people: [
    { id: 1, name: 'Dana', alpha: 3, beta: 4,  gamma: 10, active: true },
    { id: 2, name: 'Ravi', alpha: 7, beta: 2,  gamma: 5,  active: true },
    { id: 3, name: 'Uma',  alpha: 5, beta: 20, gamma: 5,  active: true },
  ],
  follows: [
    { from: 1, to: 2 }, { from: 1, to: 3 },
    { from: 3, to: 1 },
  ],
};

test.describe('combined', () => {
  test('combined is influence plus synergy', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed(SEED);
    await page.goto('/');
    await page.getByTestId('nav-worksheet').click();

    await expect(page.getByTestId('person-row-1').getByTestId('concept-combined')).toHaveText('147');
    await expect(page.getByTestId('person-row-2').getByTestId('concept-combined')).toHaveText('8');
    await expect(page.getByTestId('person-row-3').getByTestId('concept-combined')).toHaveText('112');
  });
});
