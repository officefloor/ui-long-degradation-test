import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// The due date defaults from the client's payment terms, an explicit due date on an invoice still
// overrides it, and an existing invoice's due date can be changed afterwards and put back to the
// date its terms give.
test.describe('due date derived from terms', () => {
  test('terms drive the due date unless overridden', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example', paymentTermsDays: 14 }],
      projects: [{ id: 1, name: 'Website Rebuild', clientId: 1 }],
      invoices: [
        { id: 1, projectId: 1, status: 'SENT', issueDate: '2026-01-01', lineItems: [{ id: 1, description: 'A', qty: 1, unitPrice: 100 }] },
        { id: 2, projectId: 1, status: 'SENT', issueDate: '2026-01-01', dueDate: '2026-01-10', lineItems: [{ id: 2, description: 'B', qty: 1, unitPrice: 100 }] },
      ],
    });
    await page.goto('/');
    await page.getByTestId('nav-projects').click();
    await page.getByTestId('project-open-1').click();

    await expect(page.getByTestId('invoice-row-1').getByTestId('invoice-due')).toHaveText('2026-01-15');
    await expect(page.getByTestId('invoice-row-2').getByTestId('invoice-due')).toHaveText('2026-01-10');
  });

  test('changes one invoice due date and puts it back to the terms date', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example', paymentTermsDays: 14 }],
      projects: [{ id: 1, name: 'Website Rebuild', clientId: 1 }],
      invoices: [
        { id: 1, projectId: 1, status: 'SENT', issueDate: '2026-01-01', lineItems: [{ id: 1, description: 'A', qty: 1, unitPrice: 100 }] },
        { id: 2, projectId: 1, status: 'SENT', issueDate: '2026-01-01', lineItems: [{ id: 2, description: 'B', qty: 1, unitPrice: 100 }] },
      ],
    });
    await page.goto('/');
    await page.getByTestId('nav-projects').click();
    await page.getByTestId('project-open-1').click();
    await page.getByTestId('invoice-open-1').click();

    await page.getByTestId('invoice-due-input').fill('2026-02-01');
    await page.getByTestId('invoice-due-save').click();
    await expect(page.getByTestId('invoice-due')).toHaveText('2026-02-01');

    // the change is kept, and only on that invoice
    await page.getByTestId('nav-projects').click();
    await page.getByTestId('project-open-1').click();
    await expect(page.getByTestId('invoice-row-1').getByTestId('invoice-due')).toHaveText('2026-02-01');
    await expect(page.getByTestId('invoice-row-2').getByTestId('invoice-due')).toHaveText('2026-01-15');

    // changed my mind: back to the date the client's terms give
    await page.getByTestId('invoice-open-1').click();
    await page.getByTestId('invoice-due-reset').click();
    await expect(page.getByTestId('invoice-due')).toHaveText('2026-01-15');
    await page.getByTestId('nav-projects').click();
    await page.getByTestId('project-open-1').click();
    await expect(page.getByTestId('invoice-row-1').getByTestId('invoice-due')).toHaveText('2026-01-15');
  });
});
