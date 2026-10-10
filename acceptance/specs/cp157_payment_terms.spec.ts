import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// A client can have payment terms (e.g. net 30), set on their page, kept, and shown there.
test.describe('client payment terms', () => {
  test('shows a client payment terms', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example', paymentTermsDays: 30 }],
    });
    await page.goto('/');
    await page.getByTestId('nav-clients').click();
    await page.getByTestId('client-open-1').click();

    await expect(page.getByTestId('client-payment-terms')).toHaveText('Net 30');
  });

  test('sets a client payment terms on their page', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
    });
    await page.goto('/');
    await page.getByTestId('nav-clients').click();
    await page.getByTestId('client-open-1').click();

    await page.getByTestId('client-payment-terms-input').fill('45');
    await page.getByTestId('client-payment-terms-save').click();
    await expect(page.getByTestId('client-payment-terms')).toHaveText('Net 45');

    // the terms are kept: they are still there when the client is opened again
    await page.reload();
    await page.getByTestId('nav-clients').click();
    await page.getByTestId('client-open-1').click();
    await expect(page.getByTestId('client-payment-terms')).toHaveText('Net 45');
  });
});
