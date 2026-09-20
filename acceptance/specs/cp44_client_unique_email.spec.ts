import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// Two clients cannot share an email. Adding one with an email already in use is rejected with an
// error, and no new client is added.
test.describe('client unique email', () => {
  test('rejects a duplicate email', { tag: '@error' }, async ({ page }) => {
    await resetAndSeed({
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
    });
    await page.goto('/');
    await page.getByTestId('nav-clients').click();

    await page.getByTestId('client-form-name').fill('Acme Two');
    await page.getByTestId('client-form-email').fill('ops@acme.example');
    await page.getByTestId('client-form-submit').click();

    await expect(page.getByTestId('client-form-email-error')).toBeVisible();
    await expect(page.getByTestId(/^client-row-/)).toHaveCount(1);
  });
});
