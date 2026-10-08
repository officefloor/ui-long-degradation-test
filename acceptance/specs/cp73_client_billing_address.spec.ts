import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// Off-spine (control region): a client carries a billing address, shown on their page.
test.describe('client billing address', () => {
  test('shows a client billing address', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example', billingAddress: '1 Main St, Townsville' }],
    });
    await page.goto('/');
    await page.getByTestId('nav-clients').click();
    await page.getByTestId('client-open-1').click();

    await expect(page.getByTestId('client-billing-address')).toHaveText('1 Main St, Townsville');
  });
});
