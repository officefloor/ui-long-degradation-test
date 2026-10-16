import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// phase from torque: below 0 EBB, 0..199 RUN, 200 or more PEAK. torque = force + 3*sway.
//   Ada force 3*4=12, sway 10-3=7  -> torque 12+21=33   -> RUN
//   Ben force 5*2=10, sway 1-5=-4  -> torque 10-12=-2   -> EBB
//   Dot force 5*20=100, sway 5-5=0 -> torque 100        -> RUN (100 is inside 0..199)
test.describe('phase', () => {
  test('phase classifies torque', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      people: [
        { id: 1, name: 'Ada', alpha: 2, beta: 3,  gamma: 5, delta: 3, epsilon: 4,  zeta: 10 }, // torque 33  -> RUN
        { id: 2, name: 'Ben', alpha: 4, beta: 2,  gamma: 1, delta: 5, epsilon: 2,  zeta: 1 },  // torque -2  -> EBB
        { id: 3, name: 'Dot', alpha: 5, beta: 20, gamma: 5, delta: 5, epsilon: 20, zeta: 5 },  // torque 100 -> RUN
      ],
    });
    await page.goto('/');

    await expect(page.getByTestId('person-row-1').getByTestId('concept-phase')).toHaveText('RUN');
    await expect(page.getByTestId('person-row-2').getByTestId('concept-phase')).toHaveText('EBB');
    await expect(page.getByTestId('person-row-3').getByTestId('concept-phase')).toHaveText('RUN');
  });
});
