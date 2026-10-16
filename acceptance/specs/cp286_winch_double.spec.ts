import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// keel by person: Ada 491, Ben 671, Cam 1211, Dot 446
// winch = keel + ballast (then twice ballast): 991, 1051, 3411, 976  [ballast: 250, 190, 1100, 265]

test.describe('winch now adds twice ballast', () => {
  test('computes winch double', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({anchor: "2026-03-01", people: [{id: 1, name: "Ada", alpha: 2, beta: 30, gamma: 2, active: true}, {id: 2, name: "Ben", alpha: 4, beta: 30, gamma: 4, active: true}, {id: 3, name: "Cam", alpha: 10, beta: 30, gamma: 10, active: true}, {id: 4, name: "Dot", alpha: 3, beta: 15, gamma: 3, active: true}]});
    await page.goto('/');

    await expect(page.getByTestId('person-row-1').getByTestId('concept-winch')).toHaveText('991');
    await expect(page.getByTestId('person-row-2').getByTestId('concept-winch')).toHaveText('1051');
    await expect(page.getByTestId('person-row-3').getByTestId('concept-winch')).toHaveText('3411');
    await expect(page.getByTestId('person-row-4').getByTestId('concept-winch')).toHaveText('976');
  });
});
