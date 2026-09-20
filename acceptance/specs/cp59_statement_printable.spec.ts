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
    });
    await page.goto('/');
    await page.getByTestId('nav-clients').click();
    await page.getByTestId('client-open-1').click();
    await page.getByTestId('client-statement-open').click();

    await expect(page.getByTestId('statement-print-view')).toBeVisible();
    await expect(page.getByTestId('statement-grand-total')).toHaveText('$350.00');
  });
});
