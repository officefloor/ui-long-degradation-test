import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// keel by person: Ada 491, Ben 671, Cam 1211, Dot 446
// fender = keel + keystone (capped at 2000 later): 801, 981, 2000, 756  [keystone: 310, 310, 1400, 310]

test.describe('fender is capped at 3000', () => {
  test('computes fender cap', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({anchor: "2026-03-01", people: [{id: 1, name: "Ada", alpha: 2, beta: 30, gamma: 2, active: true}, {id: 2, name: "Ben", alpha: 4, beta: 30, gamma: 4, active: true}, {id: 3, name: "Cam", alpha: 10, beta: 30, gamma: 10, active: true}, {id: 4, name: "Dot", alpha: 3, beta: 15, gamma: 3, active: true}]});
    await page.goto('/');

    await expect(page.getByTestId('person-row-1').getByTestId('concept-fender')).toHaveText('801');
    await expect(page.getByTestId('person-row-2').getByTestId('concept-fender')).toHaveText('981');
    await expect(page.getByTestId('person-row-3').getByTestId('concept-fender')).toHaveText('2000');
    await expect(page.getByTestId('person-row-4').getByTestId('concept-fender')).toHaveText('756');
  });
});
