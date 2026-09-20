import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// Each client keeps contacts (name, email, role), shown on the client's page, with a form to add.
test.describe('client contacts', () => {
  test('lists a client\'s contacts', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      contacts: [
        { id: 1, clientId: 1, name: 'Dana Lee', email: 'dana@acme.example', role: 'Billing' },
        { id: 2, clientId: 1, name: 'Sam Ray', email: 'sam@acme.example', role: 'Project lead' },
      ],
    });
    await page.goto('/');
    await page.getByTestId('nav-clients').click();
    await page.getByTestId('client-open-1').click();

    await expect(page.getByTestId('client-contacts-table')).toBeVisible();
    await expect(page.getByTestId(/^contact-row-/)).toHaveCount(2);
    await expect(page.getByTestId('contact-row-1').getByTestId('contact-name')).toHaveText('Dana Lee');
    await expect(page.getByTestId('contact-row-1').getByTestId('contact-role')).toHaveText('Billing');
  });

  test('adds a contact to a client', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      contacts: [],
    });
    await page.goto('/');
    await page.getByTestId('nav-clients').click();
    await page.getByTestId('client-open-1').click();

    await page.getByTestId('contact-form-name').fill('Pat Kim');
    await page.getByTestId('contact-form-email').fill('pat@acme.example');
    await page.getByTestId('contact-form-role').fill('Finance');
    await page.getByTestId('contact-form-submit').click();

    await expect(page.getByTestId(/^contact-row-/)).toHaveCount(1);
    await expect(page.getByTestId(/^contact-row-/).first().getByTestId('contact-name')).toHaveText('Pat Kim');
  });
});
