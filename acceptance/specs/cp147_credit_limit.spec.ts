import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// A client can have a credit limit, recorded and shown on their page.
test.describe('client credit limit', () => {
  test('shows a client credit limit', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example', currency: 'USD', creditLimit: 1000 }],
    });
    await page.goto('/');
    await page.getByTestId('nav-clients').click();
    await page.getByTestId('client-open-1').click();

    await expect(page.getByTestId('client-credit-limit')).toHaveText('$1,000.00');
  });
});
