import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// norm = scaled - floor(mean of scaled across everyone computable).
// scaled here (adjusted=momentum, cp52 bands D=x1 for 0..99, C=x2 for 100..249, B=x3 for 250..499):
//   Fay mom40 ->40, Gus 60 ->60, Hal 80 ->80, Ivy 120 ->240, Jo 300 ->900
//   mean = (40+60+80+240+900)/5 = 1320/5 = 264
//   norm: -224, -204, -184, -24, 636
const SEED = {
  people: [
    { id: 1, name: 'Fay', alpha: 5,  beta: 8,  gamma: 5,  active: true }, // scaled 40
    { id: 2, name: 'Gus', alpha: 2,  beta: 30, gamma: 2,  active: true }, // scaled 60
    { id: 3, name: 'Hal', alpha: 8,  beta: 10, gamma: 8,  active: true }, // scaled 80
    { id: 4, name: 'Ivy', alpha: 4,  beta: 30, gamma: 4,  active: true }, // scaled 240
    { id: 5, name: 'Jo',  alpha: 10, beta: 30, gamma: 10, active: true }, // scaled 900
  ],
};

test.describe('norm', () => {
  test('norm is scaled minus the floor of the mean scaled', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed(SEED);
    await page.goto('/');
    await page.getByTestId('nav-worksheet').click();

    await expect(page.getByTestId('person-row-1').getByTestId('concept-norm')).toHaveText('-224');
    await expect(page.getByTestId('person-row-2').getByTestId('concept-norm')).toHaveText('-204');
    await expect(page.getByTestId('person-row-3').getByTestId('concept-norm')).toHaveText('-184');
    await expect(page.getByTestId('person-row-4').getByTestId('concept-norm')).toHaveText('-24');
    await expect(page.getByTestId('person-row-5').getByTestId('concept-norm')).toHaveText('636');
  });
});
