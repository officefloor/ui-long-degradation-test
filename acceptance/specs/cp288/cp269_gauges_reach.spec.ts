import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// keel by person: Ada 180, Ben 480, Cam 1500, Dot 135
// hull = keel - clout: 180, 480, 1500, 135  [clout: 0, 0, 0, 0]
// bow = keel + fathom: 431, 551, 2000, 401  [fathom: 251, 71, 500, 266]
// stern = keel - fathom: -71, 409, 1000, -131  [fathom: 251, 71, 500, 266]
// helm = keel + cascade: 490, 790, 2900, 445  [cascade: 310, 310, 1400, 310]

test.describe('gauges off clout, fathom, cascade', () => {
  test('computes gauges reach', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({anchor: "2026-03-01", people: [{id: 1, name: "Ada", alpha: 2, beta: 30, gamma: 2, active: true}, {id: 2, name: "Ben", alpha: 4, beta: 30, gamma: 4, active: true}, {id: 3, name: "Cam", alpha: 10, beta: 30, gamma: 10, active: true}, {id: 4, name: "Dot", alpha: 3, beta: 15, gamma: 3, active: true}]});
    await page.goto('/');

    await expect(page.getByTestId('person-row-1').getByTestId('concept-hull')).toHaveText('490');
    await expect(page.getByTestId('person-row-2').getByTestId('concept-hull')).toHaveText('670');
    await expect(page.getByTestId('person-row-3').getByTestId('concept-hull')).toHaveText('1210');
    await expect(page.getByTestId('person-row-4').getByTestId('concept-hull')).toHaveText('445');
    await expect(page.getByTestId('person-row-1').getByTestId('concept-bow')).toHaveText('740');
    await expect(page.getByTestId('person-row-2').getByTestId('concept-bow')).toHaveText('740');
    await expect(page.getByTestId('person-row-3').getByTestId('concept-bow')).toHaveText('1710');
    await expect(page.getByTestId('person-row-4').getByTestId('concept-bow')).toHaveText('710');
    await expect(page.getByTestId('person-row-1').getByTestId('concept-stern')).toHaveText('240');
    await expect(page.getByTestId('person-row-2').getByTestId('concept-stern')).toHaveText('600');
    await expect(page.getByTestId('person-row-3').getByTestId('concept-stern')).toHaveText('710');
    await expect(page.getByTestId('person-row-4').getByTestId('concept-stern')).toHaveText('180');
    await expect(page.getByTestId('person-row-1').getByTestId('concept-helm')).toHaveText('800');
    await expect(page.getByTestId('person-row-2').getByTestId('concept-helm')).toHaveText('980');
    await expect(page.getByTestId('person-row-3').getByTestId('concept-helm')).toHaveText('2610');
    await expect(page.getByTestId('person-row-4').getByTestId('concept-helm')).toHaveText('755');
  });
});
