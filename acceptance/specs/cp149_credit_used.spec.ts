import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// A client's page shows how much of their credit limit is used up by what they already owe.
test.describe('client credit used', () => {
  test('shows how much credit is used', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example', currency: 'USD', creditLimit: 1000 }],
      projects: [{ id: 1, name: 'Website Rebuild', clientId: 1 }],
      invoices: [{ id: 1, projectId: 1, status: 'SENT', lineItems: [{ id: 1, description: 'Work', qty: 1, unitPrice: 400 }] }],
    });
    await page.goto('/');
    await page.getByTestId('nav-clients').click();
    await page.getByTestId('client-open-1').click();

    await expect(page.getByTestId('client-credit-used')).toHaveText('$400.00');
  });
});
