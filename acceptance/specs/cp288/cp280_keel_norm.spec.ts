import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// keel by person: Ada 431, Ben 551, Cam 911, Dot 401
// draft = keel + scaled (capped at 2000 later): 491, 791, 1811, 446  [scaled: 60, 240, 900, 45]
// heading = keel + norm (rounded down to a ten later): 180, 480, 1500, 130  [norm: -251, -71, 589, -266]
// mast = keel * 2 (then * 3): 1293, 1653, 2733, 1203
// bilge = keel down to a multiple of a hundred: 400, 500, 900, 400

test.describe('keel subtracts norm, moving every gauge', () => {
  test('computes keel norm', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({anchor: "2026-03-01", people: [{id: 1, name: "Ada", alpha: 2, beta: 30, gamma: 2, active: true}, {id: 2, name: "Ben", alpha: 4, beta: 30, gamma: 4, active: true}, {id: 3, name: "Cam", alpha: 10, beta: 30, gamma: 10, active: true}, {id: 4, name: "Dot", alpha: 3, beta: 15, gamma: 3, active: true}]});
    await page.goto('/');

    await expect(page.getByTestId('person-row-1').getByTestId('concept-keel')).toHaveText('491');
    await expect(page.getByTestId('person-row-2').getByTestId('concept-keel')).toHaveText('671');
    await expect(page.getByTestId('person-row-3').getByTestId('concept-keel')).toHaveText('1211');
    await expect(page.getByTestId('person-row-4').getByTestId('concept-keel')).toHaveText('446');
    await expect(page.getByTestId('person-row-1').getByTestId('concept-draft')).toHaveText('550');
    await expect(page.getByTestId('person-row-2').getByTestId('concept-draft')).toHaveText('910');
    await expect(page.getByTestId('person-row-3').getByTestId('concept-draft')).toHaveText('2000');
    await expect(page.getByTestId('person-row-4').getByTestId('concept-draft')).toHaveText('490');
    await expect(page.getByTestId('person-row-1').getByTestId('concept-heading')).toHaveText('240');
    await expect(page.getByTestId('person-row-2').getByTestId('concept-heading')).toHaveText('600');
    await expect(page.getByTestId('person-row-3').getByTestId('concept-heading')).toHaveText('1800');
    await expect(page.getByTestId('person-row-4').getByTestId('concept-heading')).toHaveText('180');
    await expect(page.getByTestId('person-row-1').getByTestId('concept-mast')).toHaveText('1470');
    await expect(page.getByTestId('person-row-2').getByTestId('concept-mast')).toHaveText('2010');
    await expect(page.getByTestId('person-row-3').getByTestId('concept-mast')).toHaveText('3630');
    await expect(page.getByTestId('person-row-4').getByTestId('concept-mast')).toHaveText('1335');
    await expect(page.getByTestId('person-row-1').getByTestId('concept-bilge')).toHaveText('400');
    await expect(page.getByTestId('person-row-2').getByTestId('concept-bilge')).toHaveText('600');
    await expect(page.getByTestId('person-row-3').getByTestId('concept-bilge')).toHaveText('1200');
    await expect(page.getByTestId('person-row-4').getByTestId('concept-bilge')).toHaveText('400');
  });
});
