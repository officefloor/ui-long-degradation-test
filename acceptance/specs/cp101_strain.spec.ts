import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// strain = crest - brace. With no patrons, crest = blend and brace = momentum + 2*force, so
// strain = (momentum+torque) - (momentum+2*force) = torque - 2*force.
//   Ada blend48 brace39 -> 9 ; Ben -3 - 19 -> -22 ; Dot 200 - 300 -> -100 ; Eve 27 - 27 -> 0

test.describe('strain', () => {
  test('strain is crest minus brace', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
  people: [
    { id: 1, name: 'Ada', alpha: 2, beta: 3,  gamma: 5, delta: 3, epsilon: 4,  zeta: 10, active: true },
    { id: 2, name: 'Ben', alpha: 4, beta: 2,  gamma: 1, delta: 5, epsilon: 2,  zeta: 1,  active: true },
    { id: 3, name: 'Dot', alpha: 5, beta: 20, gamma: 5, delta: 5, epsilon: 20, zeta: 5,  active: true },
    { id: 4, name: 'Eve', alpha: 2, beta: 3,  gamma: 5, delta: 2, epsilon: 3,  zeta: 4,  active: true },
  ],
});
    await page.goto('/');

    await expect(page.getByTestId('person-row-1').getByTestId('concept-strain')).toHaveText('9');
    await expect(page.getByTestId('person-row-2').getByTestId('concept-strain')).toHaveText('-22');
    await expect(page.getByTestId('person-row-3').getByTestId('concept-strain')).toHaveText('-100');
    await expect(page.getByTestId('person-row-4').getByTestId('concept-strain')).toHaveText('0');
  });
});
