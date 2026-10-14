import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

test.describe('phase recalibrated', () => {
  test('phase uses the wider RUN band', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      people: [
        { id: 1, name: 'Ada', alpha: 2, beta: 3,  gamma: 5, delta: 3,  epsilon: 4,  zeta: 10 }, // torque 33  -> RUN
        { id: 2, name: 'Ben', alpha: 4, beta: 2,  gamma: 1, delta: 5,  epsilon: 2,  zeta: 1 },  // torque -2  -> EBB
        { id: 3, name: 'Dot', alpha: 5, beta: 20, gamma: 5, delta: 5,  epsilon: 20, zeta: 5 },  // torque 100 -> RUN (was PEAK)
        { id: 4, name: 'Max', alpha: 5, beta: 20, gamma: 5, delta: 10, epsilon: 20, zeta: 10 }, // force 200, torque 200 -> PEAK
      ],
    });
    await page.goto('/');

    await expect(page.getByTestId('person-row-1').getByTestId('concept-phase')).toHaveText('RUN');
    await expect(page.getByTestId('person-row-2').getByTestId('concept-phase')).toHaveText('EBB');
    await expect(page.getByTestId('person-row-3').getByTestId('concept-phase')).toHaveText('RUN');
    await expect(page.getByTestId('person-row-4').getByTestId('concept-phase')).toHaveText('PEAK');
  });
});
