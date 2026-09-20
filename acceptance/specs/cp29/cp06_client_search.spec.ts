import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// UPDATED (clients can be archived): search excludes archived clients even when they match.
test.describe('client search', () => {
  test('filters clients by name and skips archived matches', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      clients: [
        { id: 1, name: 'Acme Ltd', email: 'ops@acme.example' },
        { id: 2, name: 'Globex', email: 'ac@globex.example' },
        { id: 3, name: 'Initech', email: 'hi@initech.example' },
        { id: 4, name: 'Globex Old', email: 'old@globex.example', archived: true },
      ],
    });
    await page.goto('/');
    await page.getByTestId('nav-clients').click();
    await expect(page.getByTestId(/^client-row-/)).toHaveCount(3); // archived excluded from the list

    await page.getByTestId('client-search').fill('glob');
    await expect(page.getByTestId(/^client-row-/)).toHaveCount(1);
    await expect(page.getByTestId('client-row-2').getByTestId('client-name')).toHaveText('Globex');
    await expect(page.getByTestId('client-row-4')).toHaveCount(0);
  });
});
