import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// UPDATED (emails must be unique): the clients list still excludes archived clients, and creating a
// client with a fresh, unique email still works.
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
    await expect(page.getByTestId(/^client-row-/)).toHaveCount(2);
    await expect(page.getByTestId('client-row-3')).toHaveCount(0);
  });

  test('creates a client with a unique email', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({ clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }] });
    await page.goto('/');
    await page.getByTestId('nav-clients').click();
    await page.getByTestId('client-form-name').fill('Initech');
    await page.getByTestId('client-form-email').fill('billing@initech.example');
    await page.getByTestId('client-form-submit').click();
    await expect(page.getByTestId(/^client-row-/)).toHaveCount(2);
  });
});
