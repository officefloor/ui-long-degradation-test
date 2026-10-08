import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// Off-spine (control region): a client can name a separate billing contact, shown on their page.
test.describe('client billing contact', () => {
  test('shows the billing contact', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example', billingContact: 'accounts@acme.example' }],
    });
    await page.goto('/');
    await page.getByTestId('nav-clients').click();
    await page.getByTestId('client-open-1').click();

    await expect(page.getByTestId('client-billing-contact')).toHaveText('accounts@acme.example');
  });
});
