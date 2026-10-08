import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// A client can have payment terms (e.g. net 30), recorded and shown on their page.
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
});
