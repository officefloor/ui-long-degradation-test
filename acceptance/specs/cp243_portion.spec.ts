import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// portion = floor(scaled / grand-scaled * 100). grand-scaled = 1245.
//   Ada 60 -> floor(4.819)=4, Ben 240 -> floor(19.27)=19, Cam 900 -> floor(72.28)=72, Dot 45 -> floor(3.61)=3

test.describe('portion', () => {
  test('portion is scaled as a floored percent of grand scaled', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
  people: [
    { id: 1, name: 'Ada', alpha: 2,  beta: 30, gamma: 2,  active: true }, // scaled 60
    { id: 2, name: 'Ben', alpha: 4,  beta: 30, gamma: 4,  active: true }, // scaled 240
    { id: 3, name: 'Cam', alpha: 10, beta: 30, gamma: 10, active: true }, // scaled 900
    { id: 4, name: 'Dot', alpha: 3,  beta: 15, gamma: 3,  active: true }, // scaled 45
  ],
});
    await page.goto('/');

    await expect(page.getByTestId('person-row-1').getByTestId('concept-portion')).toHaveText('4');
    await expect(page.getByTestId('person-row-2').getByTestId('concept-portion')).toHaveText('19');
    await expect(page.getByTestId('person-row-3').getByTestId('concept-portion')).toHaveText('72');
    await expect(page.getByTestId('person-row-4').getByTestId('concept-portion')).toHaveText('3');
  });

  test('portion is n/a when the grand scaled is zero', { tag: '@functionality' }, async ({ page }) => {
    // every momentum is below zero -> band E -> scaled 0 -> grand scaled 0 -> portion n/a for all
    await resetAndSeed({
      people: [
        { id: 1, name: 'Lo', alpha: 5, beta: 1, gamma: 0, active: true }, // thrust 5, drift -5, momentum -10 -> scaled 0
        { id: 2, name: 'Mo', alpha: 4, beta: 1, gamma: 0, active: true }, // thrust 4, drift -4, momentum -8  -> scaled 0
      ],
    });
    await page.goto('/');

    await expect(page.getByTestId('person-row-1').getByTestId('concept-portion')).toHaveText('n/a');
    await expect(page.getByTestId('person-row-2').getByTestId('concept-portion')).toHaveText('n/a');
  });
});
