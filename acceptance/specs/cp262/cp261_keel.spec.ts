import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// keel by person: Ada 120, Ben 360, Cam 1200, Dot 90
// draft = keel + scaled (capped at 2000 later): 180, 600, 2100, 135  [scaled: 60, 240, 900, 45]
// trim = keel - scaled: 60, 120, 300, 45  [scaled: 60, 240, 900, 45]
// heading = keel + norm (rounded down to a ten later): -131, 289, 1789, -176  [norm: -251, -71, 589, -266]
// bearing = keel - norm: 371, 431, 611, 356  [norm: -251, -71, 589, -266]

test.describe('the keel hub and its first gauges', () => {
  test('computes keel', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({anchor: "2026-03-01", people: [{id: 1, name: "Ada", alpha: 2, beta: 30, gamma: 2, active: true}, {id: 2, name: "Ben", alpha: 4, beta: 30, gamma: 4, active: true}, {id: 3, name: "Cam", alpha: 10, beta: 30, gamma: 10, active: true}, {id: 4, name: "Dot", alpha: 3, beta: 15, gamma: 3, active: true}]});
    await page.goto('/');

    await expect(page.getByTestId('person-row-1').getByTestId('concept-keel')).toHaveText('180');
    await expect(page.getByTestId('person-row-2').getByTestId('concept-keel')).toHaveText('480');
    await expect(page.getByTestId('person-row-3').getByTestId('concept-keel')).toHaveText('1500');
    await expect(page.getByTestId('person-row-4').getByTestId('concept-keel')).toHaveText('135');
    await expect(page.getByTestId('person-row-1').getByTestId('concept-draft')).toHaveText('240');
    await expect(page.getByTestId('person-row-2').getByTestId('concept-draft')).toHaveText('720');
    await expect(page.getByTestId('person-row-3').getByTestId('concept-draft')).toHaveText('2400');
    await expect(page.getByTestId('person-row-4').getByTestId('concept-draft')).toHaveText('180');
    await expect(page.getByTestId('person-row-1').getByTestId('concept-trim')).toHaveText('120');
    await expect(page.getByTestId('person-row-2').getByTestId('concept-trim')).toHaveText('240');
    await expect(page.getByTestId('person-row-3').getByTestId('concept-trim')).toHaveText('600');
    await expect(page.getByTestId('person-row-4').getByTestId('concept-trim')).toHaveText('90');
    await expect(page.getByTestId('person-row-1').getByTestId('concept-heading')).toHaveText('-71');
    await expect(page.getByTestId('person-row-2').getByTestId('concept-heading')).toHaveText('409');
    await expect(page.getByTestId('person-row-3').getByTestId('concept-heading')).toHaveText('2089');
    await expect(page.getByTestId('person-row-4').getByTestId('concept-heading')).toHaveText('-131');
    await expect(page.getByTestId('person-row-1').getByTestId('concept-bearing')).toHaveText('431');
    await expect(page.getByTestId('person-row-2').getByTestId('concept-bearing')).toHaveText('551');
    await expect(page.getByTestId('person-row-3').getByTestId('concept-bearing')).toHaveText('911');
    await expect(page.getByTestId('person-row-4').getByTestId('concept-bearing')).toHaveText('401');
  });
});
