import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// keel by person: Ada 180, Ben 480, Cam 1500, Dot 135
// yaw = keel + combined (then twice combined): 300, 720, 2100, 225  [combined: 60, 120, 300, 45]

test.describe('yaw now adds twice combined', () => {
  test('computes yaw double', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({anchor: "2026-03-01", people: [{id: 1, name: "Ada", alpha: 2, beta: 30, gamma: 2, active: true}, {id: 2, name: "Ben", alpha: 4, beta: 30, gamma: 4, active: true}, {id: 3, name: "Cam", alpha: 10, beta: 30, gamma: 10, active: true}, {id: 4, name: "Dot", alpha: 3, beta: 15, gamma: 3, active: true}]});
    await page.goto('/');

    await expect(page.getByTestId('person-row-1').getByTestId('concept-yaw')).toHaveText('300');
    await expect(page.getByTestId('person-row-2').getByTestId('concept-yaw')).toHaveText('720');
    await expect(page.getByTestId('person-row-3').getByTestId('concept-yaw')).toHaveText('2100');
    await expect(page.getByTestId('person-row-4').getByTestId('concept-yaw')).toHaveText('225');
  });
});
