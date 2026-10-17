import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

test.describe('missing zero', () => {
  test('missing zero', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({people: [{id: 1, name: "Ada", alpha: 3, beta: 5, gamma: 4}, {id: 2, name: "Ben", alpha: 2, beta: 6, gamma: 3}, {id: 3, name: "Cam", alpha: 5, beta: 4, gamma: 9}, {id: 4, name: "Dot", alpha: 4, beta: 3, gamma: 2}, {id: 5, name: "Sid", alpha: 4, beta: 2, gamma: 0}, {id: 9, name: "Hz", alpha: 2, beta: 5, gamma: 3, hold: true}, {id: 6, name: "Moe", alpha: 2, beta: 4, gamma: null}], patrons: [{personId: 1, patronId: 2}, {personId: 1, patronId: 3}]});
    await page.goto('/');

    await expect(page.getByTestId('person-row-1').getByTestId('concept-momentum')).toHaveText('18');
    await expect(page.getByTestId('person-row-2').getByTestId('concept-momentum')).toHaveText('15');
    await expect(page.getByTestId('person-row-3').getByTestId('concept-momentum')).toHaveText('32');
    await expect(page.getByTestId('person-row-4').getByTestId('concept-momentum')).toHaveText('6');
    await expect(page.getByTestId('person-row-5').getByTestId('concept-momentum')).toHaveText('-4');
    await expect(page.getByTestId('person-row-6').getByTestId('concept-momentum')).toHaveText('2');
    await expect(page.getByTestId('person-row-9').getByTestId('concept-momentum')).toHaveText('13');
    await expect(page.getByTestId('person-row-1').getByTestId('concept-keel')).toHaveText('67');
    await expect(page.getByTestId('person-row-2').getByTestId('concept-keel')).toHaveText('52');
    await expect(page.getByTestId('person-row-3').getByTestId('concept-keel')).toHaveText('137');
    await expect(page.getByTestId('person-row-4').getByTestId('concept-keel')).toHaveText('7');
    await expect(page.getByTestId('person-row-5').getByTestId('concept-keel')).toHaveText('-43');
    await expect(page.getByTestId('person-row-6').getByTestId('concept-keel')).toHaveText('-13');
    await expect(page.getByTestId('person-row-9').getByTestId('concept-keel')).toHaveText('42');
    await expect(page.getByTestId('rollup-keel-total')).toHaveText('134');
  });
});
