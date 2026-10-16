import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// keel by person: Ada 180, Ben 480, Cam 1500, Dot 135
// draft = keel + scaled (capped at 2000 later): 240, 720, 2000, 180  [scaled: 60, 240, 900, 45]

test.describe('draft is capped at 2000', () => {
  test('computes draft cap', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({anchor: "2026-03-01", people: [{id: 1, name: "Ada", alpha: 2, beta: 30, gamma: 2, active: true}, {id: 2, name: "Ben", alpha: 4, beta: 30, gamma: 4, active: true}, {id: 3, name: "Cam", alpha: 10, beta: 30, gamma: 10, active: true}, {id: 4, name: "Dot", alpha: 3, beta: 15, gamma: 3, active: true}]});
    await page.goto('/');

    await expect(page.getByTestId('person-row-1').getByTestId('concept-draft')).toHaveText('240');
    await expect(page.getByTestId('person-row-2').getByTestId('concept-draft')).toHaveText('720');
    await expect(page.getByTestId('person-row-3').getByTestId('concept-draft')).toHaveText('2000');
    await expect(page.getByTestId('person-row-4').getByTestId('concept-draft')).toHaveText('180');
  });
});
