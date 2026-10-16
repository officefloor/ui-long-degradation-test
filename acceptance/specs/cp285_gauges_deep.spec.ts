import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// keel by person: Ada 491, Ben 671, Cam 1211, Dot 446
// davit = keel + ripple (then minus ripple): 801, 981, 2611, 756  [ripple: 310, 310, 1400, 310]
// gangway = keel * 4 (then * 5): 1964, 2684, 4844, 1784

test.describe('davit off ripple and gangway', () => {
  test('computes gauges deep', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({anchor: "2026-03-01", people: [{id: 1, name: "Ada", alpha: 2, beta: 30, gamma: 2, active: true}, {id: 2, name: "Ben", alpha: 4, beta: 30, gamma: 4, active: true}, {id: 3, name: "Cam", alpha: 10, beta: 30, gamma: 10, active: true}, {id: 4, name: "Dot", alpha: 3, beta: 15, gamma: 3, active: true}]});
    await page.goto('/');

    await expect(page.getByTestId('person-row-1').getByTestId('concept-davit')).toHaveText('801');
    await expect(page.getByTestId('person-row-2').getByTestId('concept-davit')).toHaveText('981');
    await expect(page.getByTestId('person-row-3').getByTestId('concept-davit')).toHaveText('2611');
    await expect(page.getByTestId('person-row-4').getByTestId('concept-davit')).toHaveText('756');
    await expect(page.getByTestId('person-row-1').getByTestId('concept-gangway')).toHaveText('1964');
    await expect(page.getByTestId('person-row-2').getByTestId('concept-gangway')).toHaveText('2684');
    await expect(page.getByTestId('person-row-3').getByTestId('concept-gangway')).toHaveText('4844');
    await expect(page.getByTestId('person-row-4').getByTestId('concept-gangway')).toHaveText('1784');
  });
});
