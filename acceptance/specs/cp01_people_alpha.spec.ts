import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// data-testid contract: acceptance/support/README.md. The worksheet is the single screen; people
// are rows; raw values are `person-<attr>` cells; concepts are `concept-<name>` cells. The seed
// fixture grows over the run; here a person is { id, name, alpha }.
test.describe('people with alpha', () => {
  test('lists seeded people with their alpha', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      people: [
        { id: 1, name: 'Dana', alpha: 3 },
        { id: 2, name: 'Ravi', alpha: 7 },
      ],
    });
    await page.goto('/');

    await expect(page.getByTestId('people-table')).toBeVisible();
    await expect(page.getByTestId(/^person-row-/)).toHaveCount(2);
    await expect(page.getByTestId('person-row-1').getByTestId('person-name')).toHaveText('Dana');
    await expect(page.getByTestId('person-row-1').getByTestId('person-alpha')).toHaveText('3');
    await expect(page.getByTestId('person-row-2').getByTestId('person-name')).toHaveText('Ravi');
    await expect(page.getByTestId('person-row-2').getByTestId('person-alpha')).toHaveText('7');
  });

  test('adds a person', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({ people: [] });
    await page.goto('/');
    await expect(page.getByTestId('people-empty')).toBeVisible();

    await page.getByTestId('person-form-name').fill('Mira');
    await page.getByTestId('person-form-alpha').fill('5');
    await page.getByTestId('person-form-submit').click();

    await expect(page.getByTestId(/^person-row-/)).toHaveCount(1);
    const row = page.getByTestId(/^person-row-/).first();
    await expect(row.getByTestId('person-name')).toHaveText('Mira');
    await expect(row.getByTestId('person-alpha')).toHaveText('5');
  });
});
