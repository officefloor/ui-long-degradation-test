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

    await expect(page.getByTestId('person-row-1').getByTestId('concept-keel')).toHaveText('431');
    await expect(page.getByTestId('person-row-2').getByTestId('concept-keel')).toHaveText('551');
    await expect(page.getByTestId('person-row-3').getByTestId('concept-keel')).toHaveText('911');
    await expect(page.getByTestId('person-row-4').getByTestId('concept-keel')).toHaveText('401');
    await expect(page.getByTestId('person-row-1').getByTestId('concept-draft')).toHaveText('491');
    await expect(page.getByTestId('person-row-2').getByTestId('concept-draft')).toHaveText('791');
    await expect(page.getByTestId('person-row-3').getByTestId('concept-draft')).toHaveText('1811');
    await expect(page.getByTestId('person-row-4').getByTestId('concept-draft')).toHaveText('446');
    await expect(page.getByTestId('person-row-1').getByTestId('concept-trim')).toHaveText('371');
    await expect(page.getByTestId('person-row-2').getByTestId('concept-trim')).toHaveText('311');
    await expect(page.getByTestId('person-row-3').getByTestId('concept-trim')).toHaveText('11');
    await expect(page.getByTestId('person-row-4').getByTestId('concept-trim')).toHaveText('356');
    await expect(page.getByTestId('person-row-1').getByTestId('concept-heading')).toHaveText('180');
    await expect(page.getByTestId('person-row-2').getByTestId('concept-heading')).toHaveText('480');
    await expect(page.getByTestId('person-row-3').getByTestId('concept-heading')).toHaveText('1500');
    await expect(page.getByTestId('person-row-4').getByTestId('concept-heading')).toHaveText('130');
    await expect(page.getByTestId('person-row-1').getByTestId('concept-bearing')).toHaveText('682');
    await expect(page.getByTestId('person-row-2').getByTestId('concept-bearing')).toHaveText('622');
    await expect(page.getByTestId('person-row-3').getByTestId('concept-bearing')).toHaveText('322');
    await expect(page.getByTestId('person-row-4').getByTestId('concept-bearing')).toHaveText('667');
  });
});
