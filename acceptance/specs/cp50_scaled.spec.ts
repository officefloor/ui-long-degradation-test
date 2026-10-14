import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// band multiplier: A=4, B=3, C=2, D=1, E=0. scaled = adjusted * band multiplier.
//   Ed E*0=0, Di 30*1=30, Cy 100*2=200, Bo 200*3=600, An 400*4=1600
const SEED = {
  people: [
    { id: 1, name: 'Ed', alpha: 3,  beta: 1,  gamma: 0,  active: true }, // adjusted -6,  E -> 0
    { id: 2, name: 'Di', alpha: 5,  beta: 6,  gamma: 5,  active: true }, // adjusted 30,  D -> 30
    { id: 3, name: 'Cy', alpha: 5,  beta: 20, gamma: 5,  active: true }, // adjusted 100, C -> 200
    { id: 4, name: 'Bo', alpha: 10, beta: 20, gamma: 10, active: true }, // adjusted 200, B -> 600
    { id: 5, name: 'An', alpha: 20, beta: 20, gamma: 20, active: true }, // adjusted 400, A -> 1600
  ],
};

test.describe('scaled', () => {
  test('scaled is adjusted times the band multiplier', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed(SEED);
    await page.goto('/');
    await page.getByTestId('nav-worksheet').click();

    await expect(page.getByTestId('person-row-1').getByTestId('concept-scaled')).toHaveText('0');
    await expect(page.getByTestId('person-row-2').getByTestId('concept-scaled')).toHaveText('30');
    await expect(page.getByTestId('person-row-3').getByTestId('concept-scaled')).toHaveText('200');
    await expect(page.getByTestId('person-row-4').getByTestId('concept-scaled')).toHaveText('600');
    await expect(page.getByTestId('person-row-5').getByTestId('concept-scaled')).toHaveText('1600');
  });
});
