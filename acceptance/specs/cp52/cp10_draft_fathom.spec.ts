import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

test.describe('draft fathom', () => {
  test('draft fathom', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({people: [{id: 1, name: "Ada", alpha: 3, beta: 5, gamma: 4}, {id: 2, name: "Ben", alpha: 2, beta: 6, gamma: 3}, {id: 3, name: "Cam", alpha: 5, beta: 4, gamma: 9}, {id: 4, name: "Dot", alpha: 4, beta: 3, gamma: 2}, {id: 5, name: "Sid", alpha: 4, beta: 2, gamma: 0}, {id: 9, name: "Hz", alpha: 2, beta: 5, gamma: 3, hold: true}, {id: 6, name: "Moe", alpha: 2, beta: 4, gamma: null}], patrons: [{personId: 1, patronId: 2}, {personId: 1, patronId: 3}]});
    await page.goto('/');

    await expect(page.getByTestId('person-row-1').getByTestId('concept-fathom')).toHaveText('118');
    await expect(page.getByTestId('person-row-2').getByTestId('concept-fathom')).toHaveText('94');
    await expect(page.getByTestId('person-row-3').getByTestId('concept-fathom')).toHaveText('221');
    await expect(page.getByTestId('person-row-4').getByTestId('concept-fathom')).toHaveText('31');
    await expect(page.getByTestId('person-row-5').getByTestId('concept-fathom')).toHaveText('-43');
    await expect(page.getByTestId('person-row-6').getByTestId('concept-fathom')).toHaveText('-1');
    await expect(page.getByTestId('person-row-9').getByTestId('concept-fathom')).toHaveText('78');
    await expect(page.getByTestId('person-row-1').getByTestId('concept-draft')).toHaveText('115');
    await expect(page.getByTestId('person-row-2').getByTestId('concept-draft')).toHaveText('91');
    await expect(page.getByTestId('person-row-3').getByTestId('concept-draft')).toHaveText('209');
    await expect(page.getByTestId('person-row-4').getByTestId('concept-draft')).toHaveText('37');
    await expect(page.getByTestId('person-row-5').getByTestId('concept-draft')).toHaveText('-31');
    await expect(page.getByTestId('person-row-6').getByTestId('concept-draft')).toHaveText('5');
    await expect(page.getByTestId('person-row-9').getByTestId('concept-draft')).toHaveText('75');
  });
});
