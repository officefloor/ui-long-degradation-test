import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// total blend: everyone's blend added together, leaving out anyone whose blend cannot be worked out.
// blend = momentum + torque.
//   Ada momentum 15, torque 33  -> blend 48
//   Ben momentum -1, torque -2  -> blend -3
//   Dot momentum 100, torque 100 -> blend 200
//   Gap has no delta -> blend n/a, left out
//   Hela momentum 1, torque 4+3*(0-4) = -8 -> blend -7
// Hela is on hold: in a sheet-wide total a person on hold counts at half, rounded down,
// so her -7 counts as -4 (not -3).
//   total blend = 48 - 3 + 200 - 4 = 241

test.describe('total blend', () => {
  test('total blend sums blend, skipping n/a and honouring the hold', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      people: [
        { id: 1, name: 'Ada',  alpha: 2, beta: 3,  gamma: 5, delta: 3,    epsilon: 4,  zeta: 10, active: true },
        { id: 2, name: 'Ben',  alpha: 4, beta: 2,  gamma: 1, delta: 5,    epsilon: 2,  zeta: 1,  active: true },
        { id: 3, name: 'Dot',  alpha: 5, beta: 20, gamma: 5, delta: 5,    epsilon: 20, zeta: 5,  active: true },
        { id: 4, name: 'Gap',  alpha: 3, beta: 3,  gamma: 3, delta: null, epsilon: 2,  zeta: 2,  active: true },
        { id: 9, name: 'Hela', alpha: 1, beta: 1,  gamma: 1, delta: 4,    epsilon: 1,  zeta: 0,  active: true, hold: true },
      ],
    });
    await page.goto('/');

    await expect(page.getByTestId('person-row-4').getByTestId('concept-blend')).toHaveText('n/a');
    await expect(page.getByTestId('person-row-9').getByTestId('concept-blend')).toHaveText('-7');
    await expect(page.getByTestId('rollup-total-blend')).toHaveText('241');
  });
});
