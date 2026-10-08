import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// MUTATIVE (revises the invoice-dates rule). The due date defaults from the client's payment terms,
// but an explicit due date on an invoice still overrides it. An updated dates spec ships in the
// sibling override folder.
test.describe('due date derived from terms', () => {
  test('terms drive the due date unless overridden', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example', paymentTermsDays: 30 }],
      projects: [{ id: 1, name: 'Website Rebuild', clientId: 1 }],
      invoices: [
        { id: 1, projectId: 1, status: 'SENT', issuedDate: '2026-01-01', lineItems: [{ id: 1, description: 'A', qty: 1, unitPrice: 100 }] },
        { id: 2, projectId: 1, status: 'SENT', issuedDate: '2026-01-01', dueDate: '2026-01-10', lineItems: [{ id: 2, description: 'B', qty: 1, unitPrice: 100 }] },
      ],
    });
    await page.goto('/');
    await page.getByTestId('nav-projects').click();
    await page.getByTestId('project-open-1').click();

    await expect(page.getByTestId('invoice-row-1').getByTestId('invoice-due')).toHaveText('2026-01-31');
    await expect(page.getByTestId('invoice-row-2').getByTestId('invoice-due')).toHaveText('2026-01-10');
  });
});
