import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// A clean, printable summary of a client's statement, showing the grand total they owe.
test.describe('printable statement', () => {
  test('shows a printable statement with a grand total', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      projects: [{ id: 1, name: 'Website Rebuild', clientId: 1 }],
      invoices: [
        { id: 1, projectId: 1, status: 'SENT', lineItems: [{ id: 1, description: 'A', qty: 1, unitPrice: 100 }] },
        { id: 2, projectId: 1, status: 'SENT', lineItems: [{ id: 2, description: 'B', qty: 1, unitPrice: 250 }] },
      ],
      // Something already paid, so "the grand total they owe" is a different number from the
      // total they were invoiced. With no payments on the statement the two agree and the
      // headline figure can be wrong without any test noticing.
      payments: [{ id: 1, invoiceId: 2, amount: 100, date: '2026-02-01' }],
    });
    await page.goto('/');
    await page.getByTestId('nav-clients').click();
    await page.getByTestId('client-open-1').click();
    await page.getByTestId('client-statement-open').click();

    await expect(page.getByTestId('statement-print-view')).toBeVisible();
    // invoiced 100 + 250 = 350; paid 100 -> still owed 250
    await expect(page.getByTestId('statement-grand-total')).toHaveText('$250.00');
  });
});
