import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// Reuse pressure: a search box grows the existing owners list. Filtering is case-insensitive on the
// owner name. When the box is empty, all owners show.
test.describe('owner search', () => {
  test('filters owners by name', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      owners: [
        { id: 1, name: 'Acme Ltd', email: 'ops@acme.example' },
        { id: 2, name: 'Globex', email: 'ac@globex.example' },
        { id: 3, name: 'Initech', email: 'hi@initech.example' },
      ],
    });
    await page.goto('/');
    await page.getByTestId('nav-owners').click();
    await expect(page.getByTestId(/^owner-row-/)).toHaveCount(3);

    await page.getByTestId('owner-search').fill('glob');
    await expect(page.getByTestId(/^owner-row-/)).toHaveCount(1);
    await expect(page.getByTestId('owner-row-2').getByTestId('owner-name')).toHaveText('Globex');

    await page.getByTestId('owner-search').fill('');
    await expect(page.getByTestId(/^owner-row-/)).toHaveCount(3);
  });
});
