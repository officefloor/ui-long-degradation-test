import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// keel by person: Ada 180, Ben 480, Cam 1500, Dot 135
// ebb = keel - 10: 170, 470, 1490, 125
// flood = keel + 1000: 1180, 1480, 2500, 1135
// swell = keel + 1: 181, 481, 1501, 136
// draught = the size of keel, ignoring sign: 180, 480, 1500, 135

test.describe('ebb, flood, swell, draught', () => {
  test('computes gauges tide', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({anchor: "2026-03-01", people: [{id: 1, name: "Ada", alpha: 2, beta: 30, gamma: 2, active: true}, {id: 2, name: "Ben", alpha: 4, beta: 30, gamma: 4, active: true}, {id: 3, name: "Cam", alpha: 10, beta: 30, gamma: 10, active: true}, {id: 4, name: "Dot", alpha: 3, beta: 15, gamma: 3, active: true}]});
    await page.goto('/');

    await expect(page.getByTestId('person-row-1').getByTestId('concept-ebb')).toHaveText('421');
    await expect(page.getByTestId('person-row-2').getByTestId('concept-ebb')).toHaveText('541');
    await expect(page.getByTestId('person-row-3').getByTestId('concept-ebb')).toHaveText('901');
    await expect(page.getByTestId('person-row-4').getByTestId('concept-ebb')).toHaveText('391');
    await expect(page.getByTestId('person-row-1').getByTestId('concept-flood')).toHaveText('1431');
    await expect(page.getByTestId('person-row-2').getByTestId('concept-flood')).toHaveText('1551');
    await expect(page.getByTestId('person-row-3').getByTestId('concept-flood')).toHaveText('1911');
    await expect(page.getByTestId('person-row-4').getByTestId('concept-flood')).toHaveText('1401');
    await expect(page.getByTestId('person-row-1').getByTestId('concept-swell')).toHaveText('432');
    await expect(page.getByTestId('person-row-2').getByTestId('concept-swell')).toHaveText('552');
    await expect(page.getByTestId('person-row-3').getByTestId('concept-swell')).toHaveText('912');
    await expect(page.getByTestId('person-row-4').getByTestId('concept-swell')).toHaveText('402');
    await expect(page.getByTestId('person-row-1').getByTestId('concept-draught')).toHaveText('431');
    await expect(page.getByTestId('person-row-2').getByTestId('concept-draught')).toHaveText('551');
    await expect(page.getByTestId('person-row-3').getByTestId('concept-draught')).toHaveText('911');
    await expect(page.getByTestId('person-row-4').getByTestId('concept-draught')).toHaveText('401');
  });
});
