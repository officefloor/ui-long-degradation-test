import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// UPDATED invoice-dates spec (carries the explicit issue/due dates forward, adds that the due date
// defaults from the client's payment terms but an explicit due date still overrides it).
test.describe('invoice dates', () => {
  test('an invoice shows its issue and due dates', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      projects: [{ id: 1, name: 'Website Rebuild', clientId: 1 }],
      invoices: [{ id: 1, projectId: 1, amount: 100, status: 'SENT', issuedDate: '2026-01-05', dueDate: '2026-02-04' }],
    });
    await page.goto('/');
    await page.getByTestId('nav-projects').click();
    await page.getByTestId('project-open-1').click();

    await expect(page.getByTestId('invoice-row-1').getByTestId('invoice-issued')).toHaveText('2026-01-05');
    await expect(page.getByTestId('invoice-row-1').getByTestId('invoice-due')).toHaveText('2026-02-04');
  });

  test('the due date defaults from the client terms unless overridden', { tag: '@functionality' }, async ({ page }) => {
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
