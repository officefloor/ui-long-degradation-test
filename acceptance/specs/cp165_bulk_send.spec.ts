import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// All the draft invoices for a job can be sent in one action.
test.describe('bulk send drafts', () => {
  test('sends all draft invoices for a job', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      projects: [{ id: 1, name: 'Website Rebuild', clientId: 1 }],
      invoices: [
        { id: 1, projectId: 1, status: 'DRAFT', lineItems: [{ id: 1, description: 'A', qty: 1, unitPrice: 100 }] },
        { id: 2, projectId: 1, status: 'DRAFT', lineItems: [{ id: 2, description: 'B', qty: 1, unitPrice: 100 }] },
      ],
    });
    await page.goto('/');
    await page.getByTestId('nav-projects').click();
    await page.getByTestId('project-open-1').click();
    await page.getByTestId('job-bulk-send').click();

    await expect(page.getByTestId('invoice-row-1').getByTestId('invoice-status')).toHaveText('SENT');
    await expect(page.getByTestId('invoice-row-2').getByTestId('invoice-status')).toHaveText('SENT');
  });
});
