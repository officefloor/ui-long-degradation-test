import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../../support/seed';

// UPDATED (clients can be archived): the clients list excludes archived clients by default.
test.describe('clients', () => {
  test('lists seeded clients, excluding archived', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      clients: [
        { id: 1, name: 'Acme Ltd', email: 'ops@acme.example' },
        { id: 2, name: 'Globex', email: 'ac@globex.example' },
        { id: 3, name: 'Old Client', email: 'old@ex.example', archived: true },
      ],
    });
    await page.goto('/');
    await page.getByTestId('nav-clients').click();

    await expect(page.getByTestId('clients-table')).toBeVisible();
    await expect(page.getByTestId(/^client-row-/)).toHaveCount(2);
    await expect(page.getByTestId('client-row-1').getByTestId('client-name')).toHaveText('Acme Ltd');
    await expect(page.getByTestId('client-row-3')).toHaveCount(0);
  });

  test('creates a client', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({ clients: [] });
    await page.goto('/');
    await page.getByTestId('nav-clients').click();
    await expect(page.getByTestId('clients-empty')).toBeVisible();

    await page.getByTestId('client-form-name').fill('Initech');
    await page.getByTestId('client-form-email').fill('billing@initech.example');
    await page.getByTestId('client-form-submit').click();

    await expect(page.getByTestId(/^client-row-/)).toHaveCount(1);
    const row = page.getByTestId(/^client-row-/).first();
    await expect(row.getByTestId('client-name')).toHaveText('Initech');
    await expect(row.getByTestId('client-email')).toHaveText('billing@initech.example');
  });
});
