import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// MUTATIVE (mutates cp14): opening an unknown sheet id now starts a fresh empty sheet with that id,
// instead of showing a missing state. The updated cp14 ships under acceptance/specs/cp16/.
test.describe('unknown sheet starts blank', () => {
  test('opening an unknown id starts an empty sheet with that id', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({ sheets: [{ id: 'S1', people: [] }] });
    await page.goto('/');
    await page.getByTestId('nav-worksheet').click();
    await page.getByTestId('sheet-id-input').fill('FRESH');
    await page.getByTestId('sheet-load').click();

    await expect(page.getByTestId('sheet-current-id')).toHaveText('FRESH');
    await expect(page.getByTestId('people-empty')).toBeVisible();

    // and it is a usable sheet: a person added belongs to it
    await page.getByTestId('person-form-name').fill('Nia');
    await page.getByTestId('person-form-alpha').fill('1');
    await page.getByTestId('person-form-beta').fill('1');
    await page.getByTestId('person-form-gamma').fill('1');
    await page.getByTestId('person-form-submit').click();
    await expect(page.getByTestId(/^person-row-/)).toHaveCount(1);
  });
});
