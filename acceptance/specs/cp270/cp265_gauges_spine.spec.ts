import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// keel by person: Ada 180, Ben 480, Cam 1500, Dot 135
// camber = keel + adjusted: 240, 600, 1800, 180  [adjusted: 60, 120, 300, 45]
// sheer = keel + momentum (then down to a hundred): 240, 600, 1800, 180  [momentum: 60, 120, 300, 45]
// beam = keel - momentum: 120, 360, 1200, 90  [momentum: 60, 120, 300, 45]
// freeboard = keel + effective: 240, 600, 1800, 180  [effective: 60, 120, 300, 45]

test.describe('gauges against the spine', () => {
  test('computes gauges spine', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({anchor: "2026-03-01", people: [{id: 1, name: "Ada", alpha: 2, beta: 30, gamma: 2, active: true}, {id: 2, name: "Ben", alpha: 4, beta: 30, gamma: 4, active: true}, {id: 3, name: "Cam", alpha: 10, beta: 30, gamma: 10, active: true}, {id: 4, name: "Dot", alpha: 3, beta: 15, gamma: 3, active: true}]});
    await page.goto('/');

    await expect(page.getByTestId('person-row-1').getByTestId('concept-camber')).toHaveText('240');
    await expect(page.getByTestId('person-row-2').getByTestId('concept-camber')).toHaveText('600');
    await expect(page.getByTestId('person-row-3').getByTestId('concept-camber')).toHaveText('1800');
    await expect(page.getByTestId('person-row-4').getByTestId('concept-camber')).toHaveText('180');
    await expect(page.getByTestId('person-row-1').getByTestId('concept-sheer')).toHaveText('200');
    await expect(page.getByTestId('person-row-2').getByTestId('concept-sheer')).toHaveText('600');
    await expect(page.getByTestId('person-row-3').getByTestId('concept-sheer')).toHaveText('1800');
    await expect(page.getByTestId('person-row-4').getByTestId('concept-sheer')).toHaveText('100');
    await expect(page.getByTestId('person-row-1').getByTestId('concept-beam')).toHaveText('120');
    await expect(page.getByTestId('person-row-2').getByTestId('concept-beam')).toHaveText('360');
    await expect(page.getByTestId('person-row-3').getByTestId('concept-beam')).toHaveText('1200');
    await expect(page.getByTestId('person-row-4').getByTestId('concept-beam')).toHaveText('90');
    await expect(page.getByTestId('person-row-1').getByTestId('concept-freeboard')).toHaveText('240');
    await expect(page.getByTestId('person-row-2').getByTestId('concept-freeboard')).toHaveText('600');
    await expect(page.getByTestId('person-row-3').getByTestId('concept-freeboard')).toHaveText('1800');
    await expect(page.getByTestId('person-row-4').getByTestId('concept-freeboard')).toHaveText('180');
  });
});
