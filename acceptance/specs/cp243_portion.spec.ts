import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// portion = floor(scaled / grand-scaled * 100). grand-scaled = 1245.
//   Ada 60 -> floor(4.819)=4, Ben 240 -> floor(19.27)=19, Cam 900 -> floor(72.28)=72, Dot 45 -> floor(3.61)=3
const SEED = {
  people: [
    { id: 1, name: 'Ada', alpha: 2,  beta: 30, gamma: 2,  active: true }, // scaled 60
    { id: 2, name: 'Ben', alpha: 4,  beta: 30, gamma: 4,  active: true }, // scaled 240
    { id: 3, name: 'Cam', alpha: 10, beta: 30, gamma: 10, active: true }, // scaled 900
    { id: 4, name: 'Dot', alpha: 3,  beta: 15, gamma: 3,  active: true }, // scaled 45
  ],
};

test.describe('portion', () => {
  test('portion is scaled as a floored percent of grand scaled', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed(SEED);
    await page.goto('/');
    await page.getByTestId('nav-worksheet').click();

    await expect(page.getByTestId('person-row-1').getByTestId('concept-portion')).toHaveText('4');
    await expect(page.getByTestId('person-row-2').getByTestId('concept-portion')).toHaveText('19');
    await expect(page.getByTestId('person-row-3').getByTestId('concept-portion')).toHaveText('72');
    await expect(page.getByTestId('person-row-4').getByTestId('concept-portion')).toHaveText('3');
  });
});
