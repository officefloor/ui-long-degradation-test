import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// keel by person: Ada 491, Ben 671, Cam 1211, Dot 446

test.describe('the total draft', () => {
  test('computes draft total', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({anchor: "2026-03-01", people: [{id: 1, name: "Ada", alpha: 2, beta: 30, gamma: 2, active: true}, {id: 2, name: "Ben", alpha: 4, beta: 30, gamma: 4, active: true}, {id: 3, name: "Cam", alpha: 10, beta: 30, gamma: 10, active: true}, {id: 4, name: "Dot", alpha: 3, beta: 15, gamma: 3, active: true}, {id: 9, name: "Hela", alpha: 10, beta: 50, gamma: 10, active: true, hold: true}], settings: {heldInTotals: "out"}});
    await page.goto('/');

    await expect(page.getByTestId('rollup-draft-total')).toHaveText('1950');
  });
});
