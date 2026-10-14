import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// thrum fuses with the Act I scaled: thrum = scaled + torque.
// With all active and no patrons/allies/regions/score, adjusted = momentum and scaled = momentum *
// band multiplier (D x1 for 0..99, C x2 for 100..249, E x0 for <0).
//   Ada mom15 -> scaled 15; Ben mom-1 -> scaled 0; Dot mom100 -> scaled 200
//   torque: Ada 33, Ben -2, Dot 100 -> thrum 48, -2, 300

test.describe('thrum', () => {
  test('thrum is scaled plus torque', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
  people: [
    { id: 1, name: 'Ada', alpha: 2, beta: 3,  gamma: 5, delta: 3, epsilon: 4,  zeta: 10, active: true },
    { id: 2, name: 'Ben', alpha: 4, beta: 2,  gamma: 1, delta: 5, epsilon: 2,  zeta: 1,  active: true },
    { id: 3, name: 'Dot', alpha: 5, beta: 20, gamma: 5, delta: 5, epsilon: 20, zeta: 5,  active: true },
  ],
});
    await page.goto('/');

    await expect(page.getByTestId('person-row-1').getByTestId('concept-thrum')).toHaveText('48');
    await expect(page.getByTestId('person-row-2').getByTestId('concept-thrum')).toHaveText('-2');
    await expect(page.getByTestId('person-row-3').getByTestId('concept-thrum')).toHaveText('300');
  });
});
