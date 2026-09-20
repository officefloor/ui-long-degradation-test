import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// A client's name or email can be corrected from the list.
test.describe('edit client', () => {
  test('updates a client name and email', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
    });
    await page.goto('/');
    await page.getByTestId('nav-clients').click();

    await page.getByTestId('client-edit-1').click();
    await page.getByTestId('client-edit-form-name').fill('Acme Limited');
    await page.getByTestId('client-edit-form-email').fill('accounts@acme.example');
    await page.getByTestId('client-edit-form-submit').click();

    await expect(page.getByTestId('client-row-1').getByTestId('client-name')).toHaveText('Acme Limited');
    await expect(page.getByTestId('client-row-1').getByTestId('client-email')).toHaveText('accounts@acme.example');
  });
});
