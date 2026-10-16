import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// keel: Ada 54, Ben 45, Cam 96, Dot 18

test.describe('heading ripple', () => {
  test('heading ripple', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({people: [{id: 1, name: "Ada", alpha: 3, beta: 5, gamma: 4}, {id: 2, name: "Ben", alpha: 2, beta: 6, gamma: 3}, {id: 3, name: "Cam", alpha: 5, beta: 4, gamma: 9}, {id: 4, name: "Dot", alpha: 4, beta: 3, gamma: 2}, {id: 5, name: "Sid", alpha: 4, beta: 2, gamma: 0}, {id: 9, name: "Hz", alpha: 2, beta: 5, gamma: 3, hold: true}, {id: 6, name: "Moe", alpha: 2, beta: 4, gamma: null}], patrons: [{personId: 1, patronId: 2}, {personId: 1, patronId: 3}]});
    await page.goto('/');

    await expect(page.getByTestId('person-row-1').getByTestId('concept-heading')).toHaveText('126');
    await expect(page.getByTestId('person-row-2').getByTestId('concept-heading')).toHaveText('93');
    await expect(page.getByTestId('person-row-3').getByTestId('concept-heading')).toHaveText('271');
    await expect(page.getByTestId('person-row-4').getByTestId('concept-heading')).toHaveText('3');
    await expect(page.getByTestId('person-row-1').getByTestId('concept-ripple')).toHaveText('330');
    await expect(page.getByTestId('person-row-2').getByTestId('concept-ripple')).toHaveText('270');
    await expect(page.getByTestId('person-row-3').getByTestId('concept-ripple')).toHaveText('592');
    await expect(page.getByTestId('person-row-4').getByTestId('concept-ripple')).toHaveText('108');
  });
});
