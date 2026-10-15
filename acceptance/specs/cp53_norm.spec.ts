import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// norm = scaled - floor(mean of scaled across everyone computable).
// scaled here (adjusted=momentum, bands D=x1 for 0..99, C=x2 for 100..249, B=x3 for 250..499):
//   Fay mom40 ->40, Gus 60 ->60, Hal 81 ->81, Ivy 120 ->240, Jo 300 ->900
//   mean = (40+60+81+240+900)/5 = 1321/5 = 264.2 -> floor 264 (exercises the rounding down)
//   norm: -224, -204, -183, -24, 636

test.describe('norm', () => {
  test('norm is scaled minus the floor of the mean scaled', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
  people: [
    { id: 1, name: 'Fay', alpha: 5,  beta: 8,  gamma: 5,  active: true }, // scaled 40
    { id: 2, name: 'Gus', alpha: 2,  beta: 30, gamma: 2,  active: true }, // scaled 60
    { id: 3, name: 'Hal', alpha: 9,  beta: 9,  gamma: 9,  active: true }, // scaled 81
    { id: 4, name: 'Ivy', alpha: 4,  beta: 30, gamma: 4,  active: true }, // scaled 240
    { id: 5, name: 'Jo',  alpha: 10, beta: 30, gamma: 10, active: true }, // scaled 900
  ],
});
    await page.goto('/');

    await expect(page.getByTestId('person-row-1').getByTestId('concept-norm')).toHaveText('-224');
    await expect(page.getByTestId('person-row-2').getByTestId('concept-norm')).toHaveText('-204');
    await expect(page.getByTestId('person-row-3').getByTestId('concept-norm')).toHaveText('-183');
    await expect(page.getByTestId('person-row-4').getByTestId('concept-norm')).toHaveText('-24');
    await expect(page.getByTestId('person-row-5').getByTestId('concept-norm')).toHaveText('636');
  });
});
