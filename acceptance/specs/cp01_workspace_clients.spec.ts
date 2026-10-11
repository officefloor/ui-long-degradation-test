import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// The workspace at / lists the clients A to Z by name, ignoring capitals, each with its email, and
// adds a client from a name and an email; the new client takes its place in that order.
test.describe('workspace clients', () => {
  test('lists clients by name ignoring capitals', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      clients: [
        { id: 1, name: 'Zeta Supplies', email: 'sales@zeta.example' },
        { id: 2, name: 'Acme Ltd', email: 'ops@acme.example' },
        { id: 3, name: 'beta Studio', email: 'hello@beta.example' },
      ],
    });
    await page.goto('/');

    await expect(page.getByTestId('workspace')).toBeVisible();
    // Case-insensitive: 'beta Studio' sits between 'Acme Ltd' and 'Zeta Supplies'.
    await expect(page.getByTestId('client-list').getByTestId(/^client-row-\d+$/).getByTestId('client-name'))
      .toHaveText(['Acme Ltd', 'beta Studio', 'Zeta Supplies']);
    await expect(page.getByTestId('client-row-3').getByTestId('client-email')).toHaveText('hello@beta.example');
    await expect(page.getByTestId('client-row-1').getByTestId('client-email')).toHaveText('sales@zeta.example');
  });

  test('adds a client in its place in the list', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      clients: [
        { id: 1, name: 'Zeta Supplies', email: 'sales@zeta.example' },
        { id: 2, name: 'Acme Ltd', email: 'ops@acme.example' },
      ],
    });
    await page.goto('/');

    await page.getByTestId('client-form-name').fill('middleton Ltd');
    await page.getByTestId('client-form-email').fill('accounts@middleton.example');
    await page.getByTestId('client-form-submit').click();

    const rows = page.getByTestId('client-list').getByTestId(/^client-row-\d+$/);
    await expect(rows.getByTestId('client-name')).toHaveText(['Acme Ltd', 'middleton Ltd', 'Zeta Supplies']);
    await expect(rows.nth(1).getByTestId('client-email')).toHaveText('accounts@middleton.example');
  });
});
