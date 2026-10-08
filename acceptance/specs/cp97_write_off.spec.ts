import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';
import { auditLines } from '../support/audit';

// An invoice can be written off as bad debt: it stops counting toward what is owed but is kept, and
// the act is recorded.
test.describe('write off', () => {
  test('writing off an invoice removes it from what is owed', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example', currency: 'USD' }],
      projects: [{ id: 1, name: 'Website Rebuild', clientId: 1 }],
      invoices: [{ id: 1, projectId: 1, status: 'SENT', lineItems: [{ id: 1, description: 'Work', qty: 1, unitPrice: 100 }] }],
    });
    await page.goto('/');
    await page.getByTestId('nav-projects').click();
    await page.getByTestId('project-open-1').click();
    await page.getByTestId('invoice-open-1').click();
    await page.getByTestId('invoice-write-off').click();

    await expect(page.getByTestId('invoice-status')).toHaveText('WRITTEN_OFF');
    expect(auditLines()).toContain('INVOICE_WRITTEN_OFF id=1 amount=100.00');

    await page.getByTestId('nav-dashboard').click();
    await expect(page.getByTestId('dashboard-outstanding-USD')).toHaveText('$0.00');
  });
});
