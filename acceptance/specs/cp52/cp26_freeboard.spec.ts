import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// keel: Ada 67, Ben 52, Cam 137, Dot 7

test.describe('freeboard', () => {
  test('freeboard', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({people: [{id: 1, name: "Ada", alpha: 3, beta: 5, gamma: 4}, {id: 2, name: "Ben", alpha: 2, beta: 6, gamma: 3}, {id: 3, name: "Cam", alpha: 5, beta: 4, gamma: 9}, {id: 4, name: "Dot", alpha: 4, beta: 3, gamma: 2}, {id: 5, name: "Sid", alpha: 4, beta: 2, gamma: 0}, {id: 9, name: "Hz", alpha: 2, beta: 5, gamma: 3, hold: true}, {id: 6, name: "Moe", alpha: 2, beta: 4, gamma: null}], patrons: [{personId: 1, patronId: 2}, {personId: 1, patronId: 3}]});
    await page.goto('/');

    await expect(page.getByTestId('person-row-1').getByTestId('concept-freeboard')).toHaveText('33');
    await expect(page.getByTestId('person-row-2').getByTestId('concept-freeboard')).toHaveText('26');
    await expect(page.getByTestId('person-row-3').getByTestId('concept-freeboard')).toHaveText('63');
    await expect(page.getByTestId('person-row-4').getByTestId('concept-freeboard')).toHaveText('8');
  });
});
