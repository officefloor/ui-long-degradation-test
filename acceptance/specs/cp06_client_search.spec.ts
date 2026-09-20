import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// Reuse pressure: a search box grows the existing clients list. Filtering is case-insensitive on the
// client name. When the box is empty, all clients show.
test.describe('client search', () => {
  test('filters clients by name', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      clients: [
        { id: 1, name: 'Acme Ltd', email: 'ops@acme.example' },
        { id: 2, name: 'Globex', email: 'ac@globex.example' },
        { id: 3, name: 'Initech', email: 'hi@initech.example' },
      ],
    });
    await page.goto('/');
    await page.getByTestId('nav-clients').click();
    await expect(page.getByTestId(/^client-row-/)).toHaveCount(3);

    await page.getByTestId('client-search').fill('glob');
    await expect(page.getByTestId(/^client-row-/)).toHaveCount(1);
    await expect(page.getByTestId('client-row-2').getByTestId('client-name')).toHaveText('Globex');

    await page.getByTestId('client-search').fill('');
    await expect(page.getByTestId(/^client-row-/)).toHaveCount(3);
  });
});
