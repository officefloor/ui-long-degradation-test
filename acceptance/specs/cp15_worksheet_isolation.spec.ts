import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// Sheets are fully isolated: a person on one sheet never appears on another.
test.describe('worksheet isolation', () => {
  test('people do not leak between sheets', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      sheets: [
        { id: 'S1', people: [{ id: 1, name: 'Dana', alpha: 3, beta: 4, gamma: 10 }] },
        { id: 'S2', people: [{ id: 1, name: 'Ravi', alpha: 7, beta: 2, gamma: 5 }] },
      ],
    });
    await page.goto('/');
    await page.getByTestId('nav-worksheet').click();

    await page.getByTestId('sheet-id-input').fill('S1');
    await page.getByTestId('sheet-load').click();
    await expect(page.getByTestId(/^person-row-/)).toHaveCount(1);
    await expect(page.getByTestId('person-row-1').getByTestId('person-name')).toHaveText('Dana');

    await page.getByTestId('sheet-id-input').fill('S2');
    await page.getByTestId('sheet-load').click();
    await expect(page.getByTestId(/^person-row-/)).toHaveCount(1);
    await expect(page.getByTestId('person-row-1').getByTestId('person-name')).toHaveText('Ravi');
  });
});
