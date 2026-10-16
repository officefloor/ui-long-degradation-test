import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// keel by person: Ada 180, Ben 480, Cam 1500, Dot 135
// berth = keel - 100: 80, 380, 1400, 35
// wharf = keel * 3: 540, 1440, 4500, 405
// jetty = keel / 3 rounded down: 60, 160, 500, 45
// pier = keel down to a multiple of five (then fifty): 180, 480, 1500, 135

test.describe('berth, wharf, jetty, pier', () => {
  test('computes gauges moorings', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({anchor: "2026-03-01", people: [{id: 1, name: "Ada", alpha: 2, beta: 30, gamma: 2, active: true}, {id: 2, name: "Ben", alpha: 4, beta: 30, gamma: 4, active: true}, {id: 3, name: "Cam", alpha: 10, beta: 30, gamma: 10, active: true}, {id: 4, name: "Dot", alpha: 3, beta: 15, gamma: 3, active: true}]});
    await page.goto('/');

    await expect(page.getByTestId('person-row-1').getByTestId('concept-berth')).toHaveText('390');
    await expect(page.getByTestId('person-row-2').getByTestId('concept-berth')).toHaveText('570');
    await expect(page.getByTestId('person-row-3').getByTestId('concept-berth')).toHaveText('1110');
    await expect(page.getByTestId('person-row-4').getByTestId('concept-berth')).toHaveText('345');
    await expect(page.getByTestId('person-row-1').getByTestId('concept-wharf')).toHaveText('1470');
    await expect(page.getByTestId('person-row-2').getByTestId('concept-wharf')).toHaveText('2010');
    await expect(page.getByTestId('person-row-3').getByTestId('concept-wharf')).toHaveText('3630');
    await expect(page.getByTestId('person-row-4').getByTestId('concept-wharf')).toHaveText('1335');
    await expect(page.getByTestId('person-row-1').getByTestId('concept-jetty')).toHaveText('160');
    await expect(page.getByTestId('person-row-2').getByTestId('concept-jetty')).toHaveText('220');
    await expect(page.getByTestId('person-row-3').getByTestId('concept-jetty')).toHaveText('400');
    await expect(page.getByTestId('person-row-4').getByTestId('concept-jetty')).toHaveText('145');
    await expect(page.getByTestId('person-row-1').getByTestId('concept-pier')).toHaveText('450');
    await expect(page.getByTestId('person-row-2').getByTestId('concept-pier')).toHaveText('650');
    await expect(page.getByTestId('person-row-3').getByTestId('concept-pier')).toHaveText('1200');
    await expect(page.getByTestId('person-row-4').getByTestId('concept-pier')).toHaveText('400');
  });
});
