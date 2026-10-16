import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// keel by person: Ada 180, Ben 480, Cam 1500, Dot 135
// bilge = keel down to a multiple of a hundred: 100, 400, 1500, 100

test.describe('the keel spread and the bilge gauge', () => {
  test('computes keel spread', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({anchor: "2026-03-01", people: [{id: 1, name: "Ada", alpha: 2, beta: 30, gamma: 2, active: true}, {id: 2, name: "Ben", alpha: 4, beta: 30, gamma: 4, active: true}, {id: 3, name: "Cam", alpha: 10, beta: 30, gamma: 10, active: true}, {id: 4, name: "Dot", alpha: 3, beta: 15, gamma: 3, active: true}, {id: 9, name: "Hela", alpha: 10, beta: 50, gamma: 10, active: true, hold: true}]});
    await page.goto('/');

    await expect(page.getByTestId('person-row-1').getByTestId('concept-bilge')).toHaveText('400');
    await expect(page.getByTestId('person-row-2').getByTestId('concept-bilge')).toHaveText('500');
    await expect(page.getByTestId('person-row-3').getByTestId('concept-bilge')).toHaveText('900');
    await expect(page.getByTestId('person-row-4').getByTestId('concept-bilge')).toHaveText('400');
    await expect(page.getByTestId('rollup-keel-spread')).toHaveText('510');
  });
});
