import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// keel by person: Ada 180, Ben 480, Cam 1500, Dot 135
// rudder = keel - cascade: -130, 170, 100, -175  [cascade: 310, 310, 1400, 310]
// mast = keel * 2 (then * 3): 360, 960, 3000, 270
// rigging = keel / 2 rounded down: 90, 240, 750, 67
// moor = keel + 100 (then + 200): 280, 580, 1600, 235

test.describe('rudder, mast, rigging, moor', () => {
  test('computes gauges rig', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({anchor: "2026-03-01", people: [{id: 1, name: "Ada", alpha: 2, beta: 30, gamma: 2, active: true}, {id: 2, name: "Ben", alpha: 4, beta: 30, gamma: 4, active: true}, {id: 3, name: "Cam", alpha: 10, beta: 30, gamma: 10, active: true}, {id: 4, name: "Dot", alpha: 3, beta: 15, gamma: 3, active: true}]});
    await page.goto('/');

    await expect(page.getByTestId('person-row-1').getByTestId('concept-rudder')).toHaveText('-130');
    await expect(page.getByTestId('person-row-2').getByTestId('concept-rudder')).toHaveText('170');
    await expect(page.getByTestId('person-row-3').getByTestId('concept-rudder')).toHaveText('100');
    await expect(page.getByTestId('person-row-4').getByTestId('concept-rudder')).toHaveText('-175');
    await expect(page.getByTestId('person-row-1').getByTestId('concept-mast')).toHaveText('360');
    await expect(page.getByTestId('person-row-2').getByTestId('concept-mast')).toHaveText('960');
    await expect(page.getByTestId('person-row-3').getByTestId('concept-mast')).toHaveText('3000');
    await expect(page.getByTestId('person-row-4').getByTestId('concept-mast')).toHaveText('270');
    await expect(page.getByTestId('person-row-1').getByTestId('concept-rigging')).toHaveText('90');
    await expect(page.getByTestId('person-row-2').getByTestId('concept-rigging')).toHaveText('240');
    await expect(page.getByTestId('person-row-3').getByTestId('concept-rigging')).toHaveText('750');
    await expect(page.getByTestId('person-row-4').getByTestId('concept-rigging')).toHaveText('67');
    await expect(page.getByTestId('person-row-1').getByTestId('concept-moor')).toHaveText('280');
    await expect(page.getByTestId('person-row-2').getByTestId('concept-moor')).toHaveText('580');
    await expect(page.getByTestId('person-row-3').getByTestId('concept-moor')).toHaveText('1600');
    await expect(page.getByTestId('person-row-4').getByTestId('concept-moor')).toHaveText('235');
  });
});
