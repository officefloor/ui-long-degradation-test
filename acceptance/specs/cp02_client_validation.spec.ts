import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// A client needs a name and a proper email address (name@company.com; name@company is a typo), and
// no two clients share an email, ignoring capitals. A refused client shows why and adds nothing.
test.describe('client validation', () => {
  test('refuses a client without a name or with a bad email', { tag: '@error' }, async ({ page }) => {
    await resetAndSeed({ clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }] });
    await page.goto('/');
    const rows = page.getByTestId(/^client-row-\d+$/);

    await page.getByTestId('client-form-name').fill('');
    await page.getByTestId('client-form-email').fill('sam@initech.example');
    await page.getByTestId('client-form-submit').click();
    await expect(page.getByTestId('client-form-error')).toBeVisible();
    await expect(rows).toHaveCount(1);

    for (const email of ['sam@initech', 'sam.initech.example', '']) {
      await page.getByTestId('client-form-name').fill('Initech');
      await page.getByTestId('client-form-email').fill(email);
      await page.getByTestId('client-form-submit').click();
      await expect(page.getByTestId('client-form-error')).toBeVisible();
      await expect(rows).toHaveCount(1);
    }
  });

  test('refuses an email another client already has', { tag: '@error' }, async ({ page }) => {
    await resetAndSeed({ clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }] });
    await page.goto('/');

    await page.getByTestId('client-form-name').fill('Acme Holdings');
    await page.getByTestId('client-form-email').fill('OPS@Acme.example');
    await page.getByTestId('client-form-submit').click();
    await expect(page.getByTestId('client-form-error')).toBeVisible();
    await expect(page.getByTestId(/^client-row-\d+$/)).toHaveCount(1);
  });

  test('accepts a proper new client', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({ clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }] });
    await page.goto('/');

    // Same company domain, different mailbox: a different email.
    await page.getByTestId('client-form-name').fill('Acme Holdings');
    await page.getByTestId('client-form-email').fill('finance@acme.example');
    await page.getByTestId('client-form-submit').click();
    await expect(page.getByTestId(/^client-row-\d+$/).getByTestId('client-name'))
      .toHaveText(['Acme Holdings', 'Acme Ltd']);
  });
});
