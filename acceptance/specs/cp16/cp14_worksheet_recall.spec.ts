import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// now starts a fresh empty sheet with that id instead of showing a missing state.
test.describe('worksheet recall', () => {
  test('a sheet recalls its data after a page refresh', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      sheets: [
        { id: 'S1', people: [{ id: 1, name: 'Dana', alpha: 3, beta: 4, gamma: 10 }] }, // momentum 33
      ],
    });
    await page.goto('/');
    await page.getByTestId('sheet-id-input').fill('S1');
    await page.getByTestId('sheet-load').click();
    await expect(page.getByTestId('person-row-1').getByTestId('concept-momentum')).toHaveText('33');

    await page.reload();
    await page.getByTestId('sheet-id-input').fill('S1');
    await page.getByTestId('sheet-load').click();

    await expect(page.getByTestId('person-row-1').getByTestId('person-name')).toHaveText('Dana');
    await expect(page.getByTestId('person-row-1').getByTestId('person-alpha')).toHaveText('3');
    await expect(page.getByTestId('person-row-1').getByTestId('concept-momentum')).toHaveText('33');
  });

  test('opening an unknown sheet starts it empty', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({ sheets: [{ id: 'S1', people: [] }] });
    await page.goto('/');
    await page.getByTestId('sheet-id-input').fill('NOPE');
    await page.getByTestId('sheet-load').click();

    await expect(page.getByTestId('sheet-current-id')).toHaveText('NOPE');
    await expect(page.getByTestId('people-empty')).toBeVisible();
  });
});
