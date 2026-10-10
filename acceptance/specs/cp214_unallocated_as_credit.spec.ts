import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// A payment larger than the invoices it was put against leaves the remainder as the client's credit,
// and the client's page shows where their available credit comes from — each deposit, credit note
// and overpaid payment — with how much of each is still unused.
test.describe('unallocated payment as credit', () => {
  test('leftover becomes available credit', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      projects: [{ id: 1, name: 'A', clientId: 1 }],
      invoices: [{ id: 1, projectId: 1, status: 'SENT', lineItems: [{ id: 1, description: 'x', qty: 1, unitPrice: 100 }] }],
      payments: [{ id: 1, clientId: 1, amount: 150, date: '2026-02-05', allocations: [{ invoiceId: 1, amount: 100 }] }],
    });
    await page.goto('/');
    await page.getByTestId('nav-clients').click();
    await page.getByTestId('client-open-1').click();

    await expect(page.getByTestId('client-available-credit')).toHaveText('$50.00');
  });

  test('shows where the available credit comes from', { tag: '@functionality' }, async ({ page }) => {
    await resetAndSeed({
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      projects: [{ id: 1, name: 'A', clientId: 1 }],
      invoices: [
        { id: 1, projectId: 1, status: 'SENT', lineItems: [{ id: 1, description: 'x', qty: 1, unitPrice: 100 }] }, // paid in full, then credited
        { id: 2, projectId: 1, status: 'SENT', lineItems: [{ id: 2, description: 'y', qty: 1, unitPrice: 100 }] }, // paid from an overpayment
        { id: 3, projectId: 1, status: 'SENT', lineItems: [{ id: 3, description: 'z', qty: 1, unitPrice: 60 }] }, // paid from the deposit below
      ],
      payments: [
        { id: 1, invoiceId: 1, amount: 100, date: '2026-01-20' },
        { id: 2, clientId: 1, amount: 150, date: '2026-02-05', allocations: [{ invoiceId: 2, amount: 100 }] },
      ],
      creditNotes: [{ id: 1, invoiceId: 1, amount: 30, date: '2026-02-01' }],
      deposits: [{ id: 1, clientId: 1, amount: 100, date: '2026-01-15' }],
    });
    await page.goto('/');
    await page.getByTestId('nav-clients').click();
    await page.getByTestId('client-open-1').click();

    // put 60 of the 100 deposit toward invoice 3
    await page.getByTestId('client-allocate-deposit').click();
    await page.getByTestId('payment-alloc-3').fill('60');
    await page.getByTestId('payment-form-submit').click();

    await page.getByTestId('nav-clients').click();
    await page.getByTestId('client-open-1').click();
    await expect(page.getByTestId('client-available-credit')).toHaveText('$120.00'); // 40 + 30 + 50
    await expect(page.getByTestId('credit-source-row-deposit-1').getByTestId('credit-source-remaining')).toHaveText('$40.00');
    await expect(page.getByTestId('credit-source-row-creditnote-1').getByTestId('credit-source-remaining')).toHaveText('$30.00');
    await expect(page.getByTestId('credit-source-row-payment-2').getByTestId('credit-source-remaining')).toHaveText('$50.00');
  });
});
