import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// keel by person: Ada 180, Ben 480, Cam 1500, Dot 135
// buoyancy = keel - effective: 120, 360, 1200, 90  [effective: 60, 120, 300, 45]
// waterline = keel + net: 240, 600, 1800, 180  [net: 60, 120, 300, 45]
// knot = keel - net (then minus twice net): 120, 360, 1200, 90  [net: 60, 120, 300, 45]
// cable = keel + clout: 180, 480, 1500, 135  [clout: 0, 0, 0, 0]

test.describe('gauges off effective and net', () => {
  test('computes gauges flow', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({anchor: "2026-03-01", people: [{id: 1, name: "Ada", alpha: 2, beta: 30, gamma: 2, active: true}, {id: 2, name: "Ben", alpha: 4, beta: 30, gamma: 4, active: true}, {id: 3, name: "Cam", alpha: 10, beta: 30, gamma: 10, active: true}, {id: 4, name: "Dot", alpha: 3, beta: 15, gamma: 3, active: true}]});
    await page.goto('/');

    await expect(page.getByTestId('person-row-1').getByTestId('concept-buoyancy')).toHaveText('120');
    await expect(page.getByTestId('person-row-2').getByTestId('concept-buoyancy')).toHaveText('360');
    await expect(page.getByTestId('person-row-3').getByTestId('concept-buoyancy')).toHaveText('1200');
    await expect(page.getByTestId('person-row-4').getByTestId('concept-buoyancy')).toHaveText('90');
    await expect(page.getByTestId('person-row-1').getByTestId('concept-waterline')).toHaveText('240');
    await expect(page.getByTestId('person-row-2').getByTestId('concept-waterline')).toHaveText('600');
    await expect(page.getByTestId('person-row-3').getByTestId('concept-waterline')).toHaveText('1800');
    await expect(page.getByTestId('person-row-4').getByTestId('concept-waterline')).toHaveText('180');
    await expect(page.getByTestId('person-row-1').getByTestId('concept-knot')).toHaveText('60');
    await expect(page.getByTestId('person-row-2').getByTestId('concept-knot')).toHaveText('240');
    await expect(page.getByTestId('person-row-3').getByTestId('concept-knot')).toHaveText('900');
    await expect(page.getByTestId('person-row-4').getByTestId('concept-knot')).toHaveText('45');
    await expect(page.getByTestId('person-row-1').getByTestId('concept-cable')).toHaveText('180');
    await expect(page.getByTestId('person-row-2').getByTestId('concept-cable')).toHaveText('480');
    await expect(page.getByTestId('person-row-3').getByTestId('concept-cable')).toHaveText('1500');
    await expect(page.getByTestId('person-row-4').getByTestId('concept-cable')).toHaveText('135');
  });
});
