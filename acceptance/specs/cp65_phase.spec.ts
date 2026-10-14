import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// phase classifies torque: <0 EBB, 0..99 RUN, >=100 PEAK.
test.describe('phase', () => {
  test('phase classifies torque', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      people: [
        { id: 1, name: 'Ada', alpha: 2, beta: 3, gamma: 5, delta: 3, epsilon: 4,  zeta: 10 }, // torque 33  -> RUN
        { id: 2, name: 'Ben', alpha: 4, beta: 2, gamma: 1, delta: 5, epsilon: 2,  zeta: 1 },  // torque -2  -> EBB
        { id: 3, name: 'Dot', alpha: 5, beta: 20, gamma: 5, delta: 5, epsilon: 20, zeta: 5 }, // force 100, sway 0, torque 100 -> PEAK
      ],
    });
    await page.goto('/');
    await page.getByTestId('nav-worksheet').click();

    await expect(page.getByTestId('person-row-1').getByTestId('concept-phase')).toHaveText('RUN');
    await expect(page.getByTestId('person-row-2').getByTestId('concept-phase')).toHaveText('EBB');
    await expect(page.getByTestId('person-row-3').getByTestId('concept-phase')).toHaveText('PEAK');
  });
});
