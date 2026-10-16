import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// keel by person: Ada 180, Ben 480, Cam 1500, Dot 135
// pitch = keel + influence: 240, 600, 1800, 180  [influence: 60, 120, 300, 45]
// tackle = keel - influence: 120, 360, 1200, 90  [influence: 60, 120, 300, 45]
// yaw = keel + combined (then twice combined): 240, 600, 1800, 180  [combined: 60, 120, 300, 45]
// heave = keel - combined: 120, 360, 1200, 90  [combined: 60, 120, 300, 45]

test.describe('four more gauges off the keel', () => {
  test('computes gauges axis', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({anchor: "2026-03-01", people: [{id: 1, name: "Ada", alpha: 2, beta: 30, gamma: 2, active: true}, {id: 2, name: "Ben", alpha: 4, beta: 30, gamma: 4, active: true}, {id: 3, name: "Cam", alpha: 10, beta: 30, gamma: 10, active: true}, {id: 4, name: "Dot", alpha: 3, beta: 15, gamma: 3, active: true}]});
    await page.goto('/');

    await expect(page.getByTestId('person-row-1').getByTestId('concept-pitch')).toHaveText('550');
    await expect(page.getByTestId('person-row-2').getByTestId('concept-pitch')).toHaveText('790');
    await expect(page.getByTestId('person-row-3').getByTestId('concept-pitch')).toHaveText('1510');
    await expect(page.getByTestId('person-row-4').getByTestId('concept-pitch')).toHaveText('490');
    await expect(page.getByTestId('person-row-1').getByTestId('concept-tackle')).toHaveText('430');
    await expect(page.getByTestId('person-row-2').getByTestId('concept-tackle')).toHaveText('550');
    await expect(page.getByTestId('person-row-3').getByTestId('concept-tackle')).toHaveText('910');
    await expect(page.getByTestId('person-row-4').getByTestId('concept-tackle')).toHaveText('400');
    await expect(page.getByTestId('person-row-1').getByTestId('concept-yaw')).toHaveText('610');
    await expect(page.getByTestId('person-row-2').getByTestId('concept-yaw')).toHaveText('910');
    await expect(page.getByTestId('person-row-3').getByTestId('concept-yaw')).toHaveText('1810');
    await expect(page.getByTestId('person-row-4').getByTestId('concept-yaw')).toHaveText('535');
    await expect(page.getByTestId('person-row-1').getByTestId('concept-heave')).toHaveText('430');
    await expect(page.getByTestId('person-row-2').getByTestId('concept-heave')).toHaveText('550');
    await expect(page.getByTestId('person-row-3').getByTestId('concept-heave')).toHaveText('910');
    await expect(page.getByTestId('person-row-4').getByTestId('concept-heave')).toHaveText('400');
  });
});
