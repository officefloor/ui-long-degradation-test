import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// A client's available credit is their unused deposits plus unused credit notes added together.
// Here the credit note sits on an already-paid invoice, so it is unused and available, alongside an
// unused deposit.
test.describe('available credit', () => {
  test('sums unused deposits and credit notes', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      projects: [{ id: 1, name: 'Website Rebuild', clientId: 1 }],
      invoices: [{ id: 1, projectId: 1, status: 'SENT', lineItems: [{ id: 1, description: 'Work', qty: 1, unitPrice: 100 }] }],
      payments: [{ id: 1, invoiceId: 1, amount: 100, date: '2026-01-20' }],
      creditNotes: [{ id: 1, invoiceId: 1, amount: 50, date: '2026-02-01' }],
      deposits: [{ id: 1, clientId: 1, amount: 100, date: '2026-01-15' }],
    });
    await page.goto('/');
    await page.getByTestId('nav-clients').click();
    await page.getByTestId('client-open-1').click();

    await expect(page.getByTestId('client-available-credit')).toHaveText('$150.00');
  });
});
