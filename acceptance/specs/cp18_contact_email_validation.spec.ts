import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// Contacts need a valid email, same as clients.
test.describe('contact email validation', () => {
  test('rejects a bad contact email', { tag: '@error' }, async ({ page }) => {
    await resetAndSeed({
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      contacts: [],
    });
    await page.goto('/');
    await page.getByTestId('nav-clients').click();
    await page.getByTestId('client-open-1').click();

    await page.getByTestId('contact-form-name').fill('Bad Contact');
    await page.getByTestId('contact-form-email').fill('not-an-email');
    await page.getByTestId('contact-form-role').fill('Ops');
    await page.getByTestId('contact-form-submit').click();

    await expect(page.getByTestId('contact-form-email-error')).toBeVisible();
    await expect(page.getByTestId(/^contact-row-/)).toHaveCount(0);
  });
});
