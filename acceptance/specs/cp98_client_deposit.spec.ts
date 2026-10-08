import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// A client can pay a deposit up front, before any invoice. It is held against the client.
test.describe('client deposit', () => {
  test('records a deposit held for the client', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
    });
    await page.goto('/');
    await page.getByTestId('nav-clients').click();
    await page.getByTestId('client-open-1').click();

    await page.getByTestId('deposit-form-amount').fill('200');
    await page.getByTestId('deposit-form-date').fill('2026-02-01');
    await page.getByTestId('deposit-form-submit').click();

    await expect(page.getByTestId('client-deposit-total')).toHaveText('$200.00');
  });
});
