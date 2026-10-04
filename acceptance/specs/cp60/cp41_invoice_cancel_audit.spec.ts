import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';
import { auditLines } from '../support/audit';

// UPDATED for cp60 (mutates 41): cancelling an invoice is unchanged, but "what I am owed" is now
// reported per currency — cp60 replaced the single dashboard-outstanding-total with one
// dashboard-outstanding-<CUR> row per currency, so the exclusion is asserted under the client's own.
test.describe('cancel invoice', () => {
  test('cancelling voids the invoice and records it', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example', currency: 'USD' }],
      projects: [{ id: 1, name: 'Website Rebuild', clientId: 1 }],
      invoices: [{ id: 1, projectId: 1, status: 'SENT', lineItems: [{ id: 1, description: 'Work', qty: 1, unitPrice: 100 }] }],
    });
    await page.goto('/');
    await page.getByTestId('nav-projects').click();
    await page.getByTestId('project-open-1').click();

    await page.getByTestId('invoice-cancel-1').click();
    await expect(page.getByTestId('invoice-row-1').getByTestId('invoice-status')).toHaveText('VOID');
    expect(auditLines()).toContain('INVOICE_VOIDED id=1 amount=100.00');
  });

  test('a voided invoice is excluded from outstanding', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example', currency: 'USD' }],
      projects: [{ id: 1, name: 'Website Rebuild', clientId: 1 }],
      invoices: [
        { id: 1, projectId: 1, status: 'SENT', lineItems: [{ id: 1, description: 'A', qty: 1, unitPrice: 100 }] },
        { id: 2, projectId: 1, status: 'VOID', lineItems: [{ id: 2, description: 'B', qty: 1, unitPrice: 50 }] },
      ],
    });
    await page.goto('/');
    await page.getByTestId('nav-dashboard').click();
    await expect(page.getByTestId('dashboard-outstanding-USD')).toHaveText('$100.00');
  });
});
