import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// A remittance note lists which invoices a payment covered.
test.describe('remittance advice', () => {
  test('lists the invoices a payment was allocated to', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      projects: [{ id: 1, name: 'A', clientId: 1 }],
      invoices: [
        { id: 1, projectId: 1, status: 'SENT', lineItems: [{ id: 1, description: 'x', qty: 1, unitPrice: 100 }] },
        { id: 2, projectId: 1, status: 'SENT', lineItems: [{ id: 2, description: 'y', qty: 1, unitPrice: 100 }] },
      ],
      payments: [{ id: 1, clientId: 1, amount: 150, date: '2026-02-05', allocations: [{ invoiceId: 1, amount: 100 }, { invoiceId: 2, amount: 50 }] }],
    });
    await page.goto('/');
    await page.getByTestId('nav-clients').click();
    await page.getByTestId('client-open-1').click();
    await page.getByTestId('remittance-open-1').click();

    await expect(page.getByTestId('remittance-row-1').getByTestId('remittance-amount')).toHaveText('$100.00');
    await expect(page.getByTestId('remittance-row-2').getByTestId('remittance-amount')).toHaveText('$50.00');
  });
});
