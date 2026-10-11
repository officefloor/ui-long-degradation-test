import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// Each client row shows the client's balance: the amount still due across their sent invoices
// (drafts do not count), after discounts, tax and payments; and how much of it is overdue.
test.describe('client balance', () => {
  test('shows what each client owes and how much is overdue', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-04-20',
      settings: { taxRate: 10 },
      clients: [
        { id: 1, name: 'Acme Ltd', email: 'ops@acme.example' },
        { id: 2, name: 'Globex Corp', email: 'billing@globex.example' },
      ],
      invoices: [
        { id: 1, clientId: 1, status: 'SENT', issueDate: '2026-02-01', dueDate: '2026-03-31',
          lineItems: [{ id: 1, description: 'Design', qty: 1, unitPrice: 100 }] },
        { id: 2, clientId: 1, status: 'SENT', issueDate: '2026-04-01', dueDate: '2026-05-31',
          lineItems: [{ id: 2, description: 'Hosting', qty: 1, unitPrice: 50 }] },
        { id: 3, clientId: 1, status: 'DRAFT', issueDate: '2026-04-01', dueDate: '2026-05-31',
          lineItems: [{ id: 3, description: 'Extras', qty: 1, unitPrice: 40 }] },
        { id: 4, clientId: 2, status: 'SENT', issueDate: '2026-03-01', dueDate: '2026-04-30',
          lineItems: [{ id: 4, description: 'Audit', qty: 1, unitPrice: 200 }] },
      ],
      payments: [
        { id: 1, clientId: 1, amount: 30, date: '2026-03-15', allocations: [{ invoiceId: 1, amount: 30 }] },
        { id: 2, clientId: 2, amount: 220, date: '2026-04-10', allocations: [{ invoiceId: 4, amount: 220 }] },
      ],
    });
    await page.goto('/');

    // Invoice 1: 100.00 + 10.00 tax - 30.00 paid = 80.00, overdue; invoice 2: 50.00 + 5.00 = 55.00;
    // the 44.00 draft does not count. 80.00 + 55.00 = 135.00
    await expect(page.getByTestId('client-row-1').getByTestId('client-balance')).toHaveText('$135.00');
    await expect(page.getByTestId('client-row-1').getByTestId('client-overdue')).toHaveText('$80.00');
    // Invoice 4: 200.00 + 20.00 tax, paid 220.00
    await expect(page.getByTestId('client-row-2').getByTestId('client-balance')).toHaveText('$0.00');
    await expect(page.getByTestId('client-row-2').getByTestId('client-overdue')).toHaveText('$0.00');
    await page.getByTestId('client-row-1').click();
    await expect(page.getByTestId('invoice-row-1').getByTestId('invoice-status')).toHaveText('Overdue');
  });

  test('a payment lowers the balance straight away', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-04-20',
      settings: { taxRate: 10 },
      clients: [
        { id: 1, name: 'Acme Ltd', email: 'ops@acme.example' },
        { id: 2, name: 'Globex Corp', email: 'billing@globex.example' },
      ],
      invoices: [
        { id: 1, clientId: 1, status: 'SENT', issueDate: '2026-02-01', dueDate: '2026-03-31',
          lineItems: [{ id: 1, description: 'Design', qty: 1, unitPrice: 100 }] },
        { id: 2, clientId: 1, status: 'SENT', issueDate: '2026-04-01', dueDate: '2026-05-31',
          lineItems: [{ id: 2, description: 'Hosting', qty: 1, unitPrice: 50 }] },
        { id: 3, clientId: 1, status: 'DRAFT', issueDate: '2026-04-01', dueDate: '2026-05-31',
          lineItems: [{ id: 3, description: 'Extras', qty: 1, unitPrice: 40 }] },
        { id: 4, clientId: 2, status: 'SENT', issueDate: '2026-03-01', dueDate: '2026-04-30',
          lineItems: [{ id: 4, description: 'Audit', qty: 1, unitPrice: 200 }] },
      ],
      payments: [
        { id: 1, clientId: 1, amount: 30, date: '2026-03-15', allocations: [{ invoiceId: 1, amount: 30 }] },
        { id: 2, clientId: 2, amount: 220, date: '2026-04-10', allocations: [{ invoiceId: 4, amount: 220 }] },
      ],
    });
    await page.goto('/');

    await page.getByTestId('client-row-1').click();
    await page.getByTestId('invoice-row-2').click();
    await page.getByTestId('payment-form-amount').fill('20');
    await page.getByTestId('payment-form-date').fill('2026-04-20');
    await page.getByTestId('payment-form-submit').click();
    await expect(page.getByTestId('invoice-amount-due')).toHaveText('$35.00'); // 55.00 - 20.00
    await expect(page.getByTestId('client-row-1').getByTestId('client-balance')).toHaveText('$115.00'); // 80.00 + 35.00
    await expect(page.getByTestId('client-row-1').getByTestId('client-overdue')).toHaveText('$80.00');
  });
});
