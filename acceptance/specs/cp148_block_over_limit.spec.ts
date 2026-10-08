import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// MUTATIVE (revises the invoice-lifecycle rule). Sending an invoice that would take a client over
// their credit limit is blocked with a warning and the invoice stays a draft. An updated lifecycle
// spec ships in the sibling override folder.
test.describe('block over credit limit', () => {
  test('refuses to send over the limit and warns', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example', currency: 'USD', creditLimit: 100 }],
      projects: [{ id: 1, name: 'Website Rebuild', clientId: 1 }],
      invoices: [
        { id: 1, projectId: 1, status: 'SENT', lineItems: [{ id: 1, description: 'A', qty: 1, unitPrice: 100 }] },
        { id: 2, projectId: 1, status: 'DRAFT', lineItems: [{ id: 2, description: 'B', qty: 1, unitPrice: 50 }] },
      ],
    });
    await page.goto('/');
    await page.getByTestId('nav-projects').click();
    await page.getByTestId('project-open-1').click();

    await page.getByTestId('invoice-send-2').click();
    await expect(page.getByTestId('invoice-credit-warning')).toBeVisible();
    await expect(page.getByTestId('invoice-row-2').getByTestId('invoice-status')).toHaveText('DRAFT');
  });
});
