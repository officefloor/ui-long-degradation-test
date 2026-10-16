import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// drag from blend: L0 (below 0), L1 (0..49), L2 (50..149), L3 (>=150). Multipliers unchanged. The blend-150 person moves L2 -> L3.
//   drag: Ada 48 L1, Ben -3 L0, Dot 200 L3, Max 150 L3
//   lift: Ada 48, Ben 0, Dot 600, Max 150*3=450 ; counts L0 1, L1 1, L2 0, L3 2
// Hela is on hold: left out of sheet-wide figures, so of the counts too.
//   Hela blend 50 + 200 = 250 -> L3, not counted (L3 stays 2)

test.describe('drag recalibrated', () => {
  test('new thresholds reclassify and rescale', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
  people: [
    { id: 1, name: 'Ada', alpha: 2, beta: 3,  gamma: 5, delta: 3, epsilon: 4,  zeta: 10, active: true },
    { id: 2, name: 'Ben', alpha: 4, beta: 2,  gamma: 1, delta: 5, epsilon: 2,  zeta: 1,  active: true },
    { id: 3, name: 'Dot', alpha: 5, beta: 20, gamma: 5, delta: 5, epsilon: 20, zeta: 5,  active: true },
    { id: 4, name: 'Max', alpha: 5, beta: 10, gamma: 5, delta: 5, epsilon: 20, zeta: 5,  active: true },
    { id: 9, name: 'Hela', alpha: 5, beta: 10, gamma: 5, delta: 5, epsilon: 40, zeta: 5,  active: true, hold: true },
  ],
});
    await page.goto('/');

    await expect(page.getByTestId('person-row-1').getByTestId('concept-drag')).toHaveText('L1');
    await expect(page.getByTestId('person-row-2').getByTestId('concept-drag')).toHaveText('L0');
    await expect(page.getByTestId('person-row-3').getByTestId('concept-drag')).toHaveText('L3');
    await expect(page.getByTestId('person-row-4').getByTestId('concept-drag')).toHaveText('L3');

    await expect(page.getByTestId('person-row-4').getByTestId('concept-lift')).toHaveText('450');

    await expect(page.getByTestId('drag-count-L2')).toHaveText('0');
    await expect(page.getByTestId('drag-count-L3')).toHaveText('2');
  });
});
