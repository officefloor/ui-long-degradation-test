import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

test.describe('bearing keystone', () => {
  test('bearing keystone', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({people: [{id: 1, name: "Ada", alpha: 3, beta: 5, gamma: 4}, {id: 2, name: "Ben", alpha: 2, beta: 6, gamma: 3}, {id: 3, name: "Cam", alpha: 5, beta: 4, gamma: 9}, {id: 4, name: "Dot", alpha: 4, beta: 3, gamma: 2}, {id: 5, name: "Sid", alpha: 4, beta: 2, gamma: 0}, {id: 9, name: "Hz", alpha: 2, beta: 5, gamma: 3, hold: true}, {id: 6, name: "Moe", alpha: 2, beta: 4, gamma: null}], patrons: [{personId: 1, patronId: 2}, {personId: 1, patronId: 3}]});
    await page.goto('/');

    await expect(page.getByTestId('person-row-1').getByTestId('concept-keystone')).toHaveText('186');
    await expect(page.getByTestId('person-row-2').getByTestId('concept-keystone')).toHaveText('150');
    await expect(page.getByTestId('person-row-3').getByTestId('concept-keystone')).toHaveText('345');
    await expect(page.getByTestId('person-row-4').getByTestId('concept-keystone')).toHaveText('51');
    await expect(page.getByTestId('person-row-5').getByTestId('concept-keystone')).toHaveText('-63');
    await expect(page.getByTestId('person-row-6').getByTestId('concept-keystone')).toHaveText('n/a');
    await expect(page.getByTestId('person-row-9').getByTestId('concept-keystone')).toHaveText('126');
    await expect(page.getByTestId('person-row-1').getByTestId('concept-bearing')).toHaveText('45');
    await expect(page.getByTestId('person-row-2').getByTestId('concept-bearing')).toHaveText('42');
    await expect(page.getByTestId('person-row-3').getByTestId('concept-bearing')).toHaveText('59');
    await expect(page.getByTestId('person-row-4').getByTestId('concept-bearing')).toHaveText('33');
    await expect(page.getByTestId('person-row-5').getByTestId('concept-bearing')).toHaveText('23');
    await expect(page.getByTestId('person-row-6').getByTestId('concept-bearing')).toHaveText('n/a');
    await expect(page.getByTestId('person-row-9').getByTestId('concept-bearing')).toHaveText('40');
  });
});
