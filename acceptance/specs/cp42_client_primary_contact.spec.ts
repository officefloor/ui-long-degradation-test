import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// A client has one main contact. The client page shows who it is, and it can be changed.
test.describe('primary contact', () => {
  test('shows and changes the main contact', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      contacts: [
        { id: 1, clientId: 1, name: 'Dana Lee', email: 'dana@acme.example', role: 'Billing', primary: true },
        { id: 2, clientId: 1, name: 'Sam Ray', email: 'sam@acme.example', role: 'Lead' },
      ],
    });
    await page.goto('/');
    await page.getByTestId('nav-clients').click();
    await page.getByTestId('client-open-1').click();

    await expect(page.getByTestId('client-primary-contact')).toHaveText('Dana Lee');
    await page.getByTestId('contact-primary-2').click();
    await expect(page.getByTestId('client-primary-contact')).toHaveText('Sam Ray');
  });
});
