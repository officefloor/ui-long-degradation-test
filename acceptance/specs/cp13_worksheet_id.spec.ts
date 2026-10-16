import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// Persistence by worksheet id. From here the seed may group people under named sheets via a
// top-level sheets key, each sheet carrying its own people and relationships. The worksheet is
// opened by typing its id and loading it. The open id is shown at sheet-current-id, and people
// added belong to the open sheet. People at the top level of the seed (outside `sheets`) are on the
// starting sheet: the one shown before any sheet id is loaded.
test.describe('worksheet id', () => {
  test('opening a sheet shows its id and its people, and adds belong to it', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      people: [{ id: 2, name: 'Kai', alpha: 2, beta: 3, gamma: 5 }], // on the starting sheet
      sheets: [
        { id: 'S1', people: [{ id: 1, name: 'Dana', alpha: 3, beta: 4, gamma: 10 }] },
      ],
    });
    await page.goto('/');
    // the starting sheet holds the top-level people only
    await expect(page.getByTestId('person-row-2').getByTestId('person-name')).toHaveText('Kai');
    await expect(page.getByTestId(/^person-row-\d+$/)).toHaveCount(1);

    await page.getByTestId('sheet-id-input').fill('S1');
    await page.getByTestId('sheet-load').click();

    await expect(page.getByTestId('sheet-current-id')).toHaveText('S1');
    await expect(page.getByTestId(/^person-row-\d+$/)).toHaveCount(1);
    await expect(page.getByTestId('person-row-1').getByTestId('person-name')).toHaveText('Dana');
    await expect(page.getByTestId('person-row-2')).toHaveCount(0); // Kai stays on the starting sheet

    await page.getByTestId('person-form-name').fill('Ravi');
    await page.getByTestId('person-form-alpha').fill('7');
    await page.getByTestId('person-form-beta').fill('2');
    await page.getByTestId('person-form-gamma').fill('5');
    await page.getByTestId('person-form-submit').click();

    await expect(page.getByTestId(/^person-row-\d+$/)).toHaveCount(2);
  });
});
