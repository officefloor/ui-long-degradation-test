import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';
import { auditLines } from '../support/audit';

// Status transition + the AUDIT-FILE channel (DESIGN.md §3): paying an invoice flips its status in
// the UI AND writes one audit record to the known file. Invoices carry a status (default UNPAID).
test.describe('invoice payment', () => {
  test('marking an invoice paid updates its status', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      owners: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      projects: [{ id: 1, name: 'Website Rebuild', ownerId: 1 }],
      invoices: [{ id: 1, projectId: 1, amount: 100, status: 'UNPAID' }],
    });
    await page.goto('/');
    await page.getByTestId('nav-projects').click();
    await page.getByTestId('project-open-1').click();

    await expect(page.getByTestId('invoice-row-1').getByTestId('invoice-status')).toHaveText('UNPAID');
    await page.getByTestId('invoice-pay-1').click();
    await expect(page.getByTestId('invoice-row-1').getByTestId('invoice-status')).toHaveText('PAID');
  });

  test('paying an invoice writes an audit record', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      owners: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      projects: [{ id: 1, name: 'Website Rebuild', ownerId: 1 }],
      invoices: [{ id: 1, projectId: 1, amount: 100, status: 'UNPAID' }],
    });
    await page.goto('/');
    await page.getByTestId('nav-projects').click();
    await page.getByTestId('project-open-1').click();
    await page.getByTestId('invoice-pay-1').click();
    await expect(page.getByTestId('invoice-row-1').getByTestId('invoice-status')).toHaveText('PAID');

    // Side-effect asserted through the audit file, not the UI.
    expect(auditLines()).toContain('INVOICE_PAID id=1 amount=100.00');
  });
});
