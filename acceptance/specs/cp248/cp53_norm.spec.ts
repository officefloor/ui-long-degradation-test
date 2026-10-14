import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../../support/seed';


test.describe('norm', () => {
  test('norm is scaled minus the floor of the mean scaled', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
  people: [
    { id: 1, name: 'Fay', alpha: 5,  beta: 8,  gamma: 5,  active: true }, // 40
    { id: 2, name: 'Gus', alpha: 2,  beta: 30, gamma: 2,  active: true }, // 60
    { id: 3, name: 'Hal', alpha: 8,  beta: 10, gamma: 8,  active: true }, // 80
    { id: 4, name: 'Ivy', alpha: 4,  beta: 30, gamma: 4,  active: true }, // 240
    { id: 5, name: 'Jo',  alpha: 10, beta: 30, gamma: 10, active: true }, // 900
  ],
});
    await page.goto('/');

    await expect(page.getByTestId('person-row-1').getByTestId('concept-norm')).toHaveText('-224');
    await expect(page.getByTestId('person-row-2').getByTestId('concept-norm')).toHaveText('-204');
    await expect(page.getByTestId('person-row-3').getByTestId('concept-norm')).toHaveText('-184');
    await expect(page.getByTestId('person-row-4').getByTestId('concept-norm')).toHaveText('-24');
    await expect(page.getByTestId('person-row-5').getByTestId('concept-norm')).toHaveText('636');
  });
});
