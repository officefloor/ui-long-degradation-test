import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// Persistence by worksheet id. From here the seed may name sheets: resetAndSeed({ sheets: [{ id,
// people, patrons? }] }). The worksheet is opened by typing its id and loading it; the open id is
// shown at `sheet-current-id`; people added belong to the open sheet.
test.describe('worksheet id', () => {
  test('opening a sheet shows its id and its people, and adds belong to it', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      sheets: [
        { id: 'S1', people: [{ id: 1, name: 'Dana', alpha: 3, beta: 4, gamma: 10 }] },
      ],
    });
    await page.goto('/');
    await page.getByTestId('nav-worksheet').click();
    await page.getByTestId('sheet-id-input').fill('S1');
    await page.getByTestId('sheet-load').click();

    await expect(page.getByTestId('sheet-current-id')).toHaveText('S1');
    await expect(page.getByTestId(/^person-row-/)).toHaveCount(1);
    await expect(page.getByTestId('person-row-1').getByTestId('person-name')).toHaveText('Dana');

    await page.getByTestId('person-form-name').fill('Ravi');
    await page.getByTestId('person-form-alpha').fill('7');
    await page.getByTestId('person-form-beta').fill('2');
    await page.getByTestId('person-form-gamma').fill('5');
    await page.getByTestId('person-form-submit').click();

    await expect(page.getByTestId(/^person-row-/)).toHaveCount(2);
  });
});
