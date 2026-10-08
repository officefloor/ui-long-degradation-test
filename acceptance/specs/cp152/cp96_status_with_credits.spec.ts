import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// UPDATED status-with-credits spec (carries the credit-settles-balance rule forward, adds partial
// write-off): a write-off of the remaining balance, alongside payments, settles the invoice.
test.describe('status accounts for credits', () => {
  test('a credit that clears the balance settles the invoice', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      projects: [{ id: 1, name: 'Website Rebuild', clientId: 1 }],
      invoices: [{ id: 1, projectId: 1, status: 'SENT', lineItems: [{ id: 1, description: 'Work', qty: 1, unitPrice: 100 }] }],
      payments: [{ id: 1, invoiceId: 1, amount: 40, date: '2026-02-01' }],
      creditNotes: [{ id: 1, invoiceId: 1, amount: 60, date: '2026-02-02' }],
    });
    await page.goto('/');
    await page.getByTestId('nav-projects').click();
    await page.getByTestId('project-open-1').click();

    await expect(page.getByTestId('invoice-row-1').getByTestId('invoice-due-amount')).toHaveText('$0.00');
    await expect(page.getByTestId('invoice-row-1').getByTestId('invoice-status')).toHaveText('PAID');
  });

  test('a write-off of the remaining balance settles the invoice', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      projects: [{ id: 1, name: 'Website Rebuild', clientId: 1 }],
      invoices: [{ id: 1, projectId: 1, status: 'SENT', writeOff: 60, lineItems: [{ id: 1, description: 'Work', qty: 1, unitPrice: 100 }] }],
      payments: [{ id: 1, invoiceId: 1, amount: 40, date: '2026-02-01' }],
    });
    await page.goto('/');
    await page.getByTestId('nav-projects').click();
    await page.getByTestId('project-open-1').click();

    await expect(page.getByTestId('invoice-row-1').getByTestId('invoice-due-amount')).toHaveText('$0.00');
    await expect(page.getByTestId('invoice-row-1').getByTestId('invoice-status')).toHaveText('PAID');
  });
});
