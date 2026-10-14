import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// ebb = blend - median(blend over computable people; lower of two middles for even count).
// Here delta=epsilon=zeta=0 so force=sway=torque=0 and blend = momentum.
//   blend: Fay 40, Gus 60, Hal 80, Ivy 240, Jo 900 -> median 80
//   ebb: -40, -20, 0, 160, 820
const SEED = {
  people: [
    { id: 1, name: 'Fay', alpha: 5,  beta: 8,  gamma: 5,  delta: 0, epsilon: 0, zeta: 0, active: true }, // mom 40
    { id: 2, name: 'Gus', alpha: 2,  beta: 30, gamma: 2,  delta: 0, epsilon: 0, zeta: 0, active: true }, // mom 60
    { id: 3, name: 'Hal', alpha: 8,  beta: 10, gamma: 8,  delta: 0, epsilon: 0, zeta: 0, active: true }, // mom 80
    { id: 4, name: 'Ivy', alpha: 4,  beta: 60, gamma: 4,  delta: 0, epsilon: 0, zeta: 0, active: true }, // mom 240
    { id: 5, name: 'Jo',  alpha: 10, beta: 90, gamma: 10, delta: 0, epsilon: 0, zeta: 0, active: true }, // mom 900
  ],
};

test.describe('ebb', () => {
  test('ebb is blend minus the median blend', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed(SEED);
    await page.goto('/');
    await page.getByTestId('nav-worksheet').click();

    await expect(page.getByTestId('person-row-1').getByTestId('concept-ebb')).toHaveText('-40');
    await expect(page.getByTestId('person-row-2').getByTestId('concept-ebb')).toHaveText('-20');
    await expect(page.getByTestId('person-row-3').getByTestId('concept-ebb')).toHaveText('0');
    await expect(page.getByTestId('person-row-4').getByTestId('concept-ebb')).toHaveText('160');
    await expect(page.getByTestId('person-row-5').getByTestId('concept-ebb')).toHaveText('820');
  });
});
