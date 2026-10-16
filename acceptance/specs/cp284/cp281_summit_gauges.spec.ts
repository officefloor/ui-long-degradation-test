import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// keel by person: Ada 431, Ben 551, Cam 911, Dot 401
// summit = keystone + keel: 741, 861, 2311, 711  [keystone: 310, 310, 1400, 310]
// fender = keel + keystone (capped at 2000 later): 741, 861, 2311, 711  [keystone: 310, 310, 1400, 310]
// cleat = keel - keystone: 121, 241, -489, 91  [keystone: 310, 310, 1400, 310]
// winch = keel + ballast (then twice ballast): 681, 741, 2011, 666  [ballast: 250, 190, 1100, 265]
// capstan = keel - ballast: 181, 361, -189, 136  [ballast: 250, 190, 1100, 265]

test.describe('the summit level and four keel gauges', () => {
  test('computes summit gauges', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({anchor: "2026-03-01", people: [{id: 1, name: "Ada", alpha: 2, beta: 30, gamma: 2, active: true}, {id: 2, name: "Ben", alpha: 4, beta: 30, gamma: 4, active: true}, {id: 3, name: "Cam", alpha: 10, beta: 30, gamma: 10, active: true}, {id: 4, name: "Dot", alpha: 3, beta: 15, gamma: 3, active: true}]});
    await page.goto('/');

    await expect(page.getByTestId('person-row-1').getByTestId('concept-summit')).toHaveText('801');
    await expect(page.getByTestId('person-row-2').getByTestId('concept-summit')).toHaveText('981');
    await expect(page.getByTestId('person-row-3').getByTestId('concept-summit')).toHaveText('2611');
    await expect(page.getByTestId('person-row-4').getByTestId('concept-summit')).toHaveText('756');
    await expect(page.getByTestId('person-row-1').getByTestId('concept-fender')).toHaveText('801');
    await expect(page.getByTestId('person-row-2').getByTestId('concept-fender')).toHaveText('981');
    await expect(page.getByTestId('person-row-3').getByTestId('concept-fender')).toHaveText('2000');
    await expect(page.getByTestId('person-row-4').getByTestId('concept-fender')).toHaveText('756');
    await expect(page.getByTestId('person-row-1').getByTestId('concept-cleat')).toHaveText('181');
    await expect(page.getByTestId('person-row-2').getByTestId('concept-cleat')).toHaveText('361');
    await expect(page.getByTestId('person-row-3').getByTestId('concept-cleat')).toHaveText('-189');
    await expect(page.getByTestId('person-row-4').getByTestId('concept-cleat')).toHaveText('136');
    await expect(page.getByTestId('person-row-1').getByTestId('concept-winch')).toHaveText('741');
    await expect(page.getByTestId('person-row-2').getByTestId('concept-winch')).toHaveText('861');
    await expect(page.getByTestId('person-row-3').getByTestId('concept-winch')).toHaveText('2311');
    await expect(page.getByTestId('person-row-4').getByTestId('concept-winch')).toHaveText('711');
    await expect(page.getByTestId('person-row-1').getByTestId('concept-capstan')).toHaveText('241');
    await expect(page.getByTestId('person-row-2').getByTestId('concept-capstan')).toHaveText('481');
    await expect(page.getByTestId('person-row-3').getByTestId('concept-capstan')).toHaveText('111');
    await expect(page.getByTestId('person-row-4').getByTestId('concept-capstan')).toHaveText('181');
  });
});
