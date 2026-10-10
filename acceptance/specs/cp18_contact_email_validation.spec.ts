import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// Contacts need a valid email, same as clients, and one client cannot have two contacts with the
// same email (capital letters do not make it a different address). Another client may have a
// contact with that email.
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

  test('rejects a second contact with the same email on one client', { tag: '@error' }, async ({ page }) => {
    await resetAndSeed({
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      contacts: [{ id: 1, clientId: 1, name: 'Dana Lee', email: 'dana@acme.example', role: 'Billing' }],
    });
    await page.goto('/');
    await page.getByTestId('nav-clients').click();
    await page.getByTestId('client-open-1').click();

    await page.getByTestId('contact-form-name').fill('Dana Lee Again');
    await page.getByTestId('contact-form-email').fill('DANA@acme.example');
    await page.getByTestId('contact-form-role').fill('Finance');
    await page.getByTestId('contact-form-submit').click();

    await expect(page.getByTestId('contact-form-email-error')).toBeVisible();
    await expect(page.getByTestId(/^contact-row-/)).toHaveCount(1);
  });

  test('another client may have a contact with that email', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      clients: [
        { id: 1, name: 'Acme Ltd', email: 'ops@acme.example' },
        { id: 2, name: 'Globex', email: 'ac@globex.example' },
      ],
      contacts: [{ id: 1, clientId: 1, name: 'Dana Lee', email: 'dana@acme.example', role: 'Billing' }],
    });
    await page.goto('/');
    await page.getByTestId('nav-clients').click();
    await page.getByTestId('client-open-2').click();

    await page.getByTestId('contact-form-name').fill('Dana Lee');
    await page.getByTestId('contact-form-email').fill('dana@acme.example');
    await page.getByTestId('contact-form-role').fill('Advisor');
    await page.getByTestId('contact-form-submit').click();

    await expect(page.getByTestId(/^contact-row-/)).toHaveCount(1);
    await expect(page.getByTestId('contact-form-email-error')).toHaveCount(0);
  });
});
