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

    await expect(page.getByTestId('person-row-1').getByTestId('concept-berth')).toHaveText('331');
    await expect(page.getByTestId('person-row-2').getByTestId('concept-berth')).toHaveText('451');
    await expect(page.getByTestId('person-row-3').getByTestId('concept-berth')).toHaveText('811');
    await expect(page.getByTestId('person-row-4').getByTestId('concept-berth')).toHaveText('301');
    await expect(page.getByTestId('person-row-1').getByTestId('concept-wharf')).toHaveText('1293');
    await expect(page.getByTestId('person-row-2').getByTestId('concept-wharf')).toHaveText('1653');
    await expect(page.getByTestId('person-row-3').getByTestId('concept-wharf')).toHaveText('2733');
    await expect(page.getByTestId('person-row-4').getByTestId('concept-wharf')).toHaveText('1203');
    await expect(page.getByTestId('person-row-1').getByTestId('concept-jetty')).toHaveText('143');
    await expect(page.getByTestId('person-row-2').getByTestId('concept-jetty')).toHaveText('183');
    await expect(page.getByTestId('person-row-3').getByTestId('concept-jetty')).toHaveText('303');
    await expect(page.getByTestId('person-row-4').getByTestId('concept-jetty')).toHaveText('133');
    await expect(page.getByTestId('person-row-1').getByTestId('concept-pier')).toHaveText('400');
    await expect(page.getByTestId('person-row-2').getByTestId('concept-pier')).toHaveText('550');
    await expect(page.getByTestId('person-row-3').getByTestId('concept-pier')).toHaveText('900');
    await expect(page.getByTestId('person-row-4').getByTestId('concept-pier')).toHaveText('400');
  });
});
