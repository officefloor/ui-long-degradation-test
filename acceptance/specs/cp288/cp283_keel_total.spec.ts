import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// keel by person: Ada 491, Ben 671, Cam 1211, Dot 446
// hawser = keel + 2: 493, 673, 1213, 448
// bollard = keel - 2: 489, 669, 1209, 444

test.describe('the total keel and two more gauges', () => {
  test('computes keel total', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({anchor: "2026-03-01", people: [{id: 1, name: "Ada", alpha: 2, beta: 30, gamma: 2, active: true}, {id: 2, name: "Ben", alpha: 4, beta: 30, gamma: 4, active: true}, {id: 3, name: "Cam", alpha: 10, beta: 30, gamma: 10, active: true}, {id: 4, name: "Dot", alpha: 3, beta: 15, gamma: 3, active: true}, {id: 9, name: "Hela", alpha: 10, beta: 50, gamma: 10, active: true, hold: true}], settings: {heldInTotals: "out"}});
    await page.goto('/');

    await expect(page.getByTestId('person-row-1').getByTestId('concept-hawser')).toHaveText('490');
    await expect(page.getByTestId('person-row-2').getByTestId('concept-hawser')).toHaveText('670');
    await expect(page.getByTestId('person-row-3').getByTestId('concept-hawser')).toHaveText('1210');
    await expect(page.getByTestId('person-row-4').getByTestId('concept-hawser')).toHaveText('445');
    await expect(page.getByTestId('person-row-1').getByTestId('concept-bollard')).toHaveText('485');
    await expect(page.getByTestId('person-row-2').getByTestId('concept-bollard')).toHaveText('665');
    await expect(page.getByTestId('person-row-3').getByTestId('concept-bollard')).toHaveText('1205');
    await expect(page.getByTestId('person-row-4').getByTestId('concept-bollard')).toHaveText('440');
    await expect(page.getByTestId('rollup-keel-total')).toHaveText('1162');
  });
});
