import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// One reconciliation screen proves the books balance: the sum of every client's balance equals the
// total outstanding. Two clients owe $100.00 and $200.00; the reconciliation total is $300.00 and
// matches the dashboard outstanding figure.
test.describe('grand reconciliation', () => {
  test('client balances sum to total outstanding', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      clients: [
        { id: 1, name: 'Acme Ltd', email: 'a@acme.example', currency: 'USD' },
        { id: 2, name: 'Globex', email: 'b@globex.example', currency: 'USD' },
      ],
      projects: [
        { id: 1, name: 'A', clientId: 1 },
        { id: 2, name: 'B', clientId: 2 },
      ],
      invoices: [
        { id: 1, projectId: 1, status: 'SENT', lineItems: [{ id: 1, description: 'Work', qty: 1, unitPrice: 100 }] },
        { id: 2, projectId: 2, status: 'SENT', lineItems: [{ id: 2, description: 'Work', qty: 1, unitPrice: 200 }] },
      ],
    });
    await page.goto('/');
    await page.getByTestId('nav-dashboard').click();
    await page.getByTestId('reconciliation-open').click();

    await expect(page.getByTestId('reconciliation-client-row-1')).toHaveText(/\$100\.00/);
    await expect(page.getByTestId('reconciliation-client-row-2')).toHaveText(/\$200\.00/);
    await expect(page.getByTestId('reconciliation-total')).toHaveText('$300.00');
    await expect(page.getByTestId('reconciliation-balanced')).toHaveText('Balanced');
  });
});
