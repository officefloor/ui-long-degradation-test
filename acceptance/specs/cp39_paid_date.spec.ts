import { test, expect } from '@playwright/test';
import { resetAndSeed } from '../support/seed';

// A fully paid invoice shows the date it was paid: the date of the payment that cleared it, taking
// payments in date order. When that date is after the due date its status is Paid late instead of
// Paid. The paid date shows only while the invoice is fully paid.
test.describe('paid date', () => {
  test('shows the date the clearing payment was made', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-04-20',
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      invoices: [
        { id: 1, clientId: 1, status: 'SENT', issueDate: '2026-02-01', dueDate: '2026-03-31',
          lineItems: [{ id: 1, description: 'Design', qty: 1, unitPrice: 100 }] },
        { id: 2, clientId: 1, status: 'SENT', issueDate: '2026-02-01', dueDate: '2026-03-31',
          lineItems: [{ id: 2, description: 'Hosting', qty: 1, unitPrice: 100 }] },
        { id: 3, clientId: 1, status: 'SENT', issueDate: '2026-02-01', dueDate: '2026-03-31',
          lineItems: [{ id: 3, description: 'Support', qty: 1, unitPrice: 100 }] },
      ],
      payments: [
        { id: 1, clientId: 1, amount: 50, date: '2026-03-10', allocations: [{ invoiceId: 1, amount: 50 }] },
        { id: 2, clientId: 1, amount: 50, date: '2026-03-25', allocations: [{ invoiceId: 1, amount: 50 }] },
        { id: 3, clientId: 1, amount: 30, date: '2026-03-20', allocations: [{ invoiceId: 2, amount: 30 }] },
        { id: 4, clientId: 1, amount: 70, date: '2026-04-05', allocations: [{ invoiceId: 2, amount: 70 }] },
        { id: 5, clientId: 1, amount: 60, date: '2026-04-02', allocations: [{ invoiceId: 3, amount: 60 }] },
        { id: 6, clientId: 1, amount: 40, date: '2026-03-15', allocations: [{ invoiceId: 3, amount: 40 }] },
      ],
    });
    await page.goto('/');

    await page.getByTestId('client-row-1').click();
    const status = (id: number) => page.getByTestId(`invoice-row-${id}`).getByTestId('invoice-status');
    await expect(status(1)).toHaveText('Paid');        // cleared 03-25, due 03-31
    await expect(status(2)).toHaveText('Paid late');   // cleared 04-05
    // In date order 40.00 (03-15) then 60.00 (04-02) clears it; in id order it would clear on 03-15.
    await expect(status(3)).toHaveText('Paid late');
    await page.getByTestId('invoice-row-1').click();
    await expect(page.getByTestId('invoice-paid-date')).toHaveText('2026-03-25');
    await page.getByTestId('invoice-row-2').click();
    await expect(page.getByTestId('invoice-paid-date')).toHaveText('2026-04-05');
    await page.getByTestId('invoice-row-3').click();
    await expect(page.getByTestId('invoice-paid-date')).toHaveText('2026-04-02');
    await expect(page.getByTestId('invoice-panel-status')).toHaveText('Paid late');
  });

  test('reversing the clearing payment takes the paid date away', { tag: '@core' }, async ({ page }) => {
    await resetAndSeed({
      asOf: '2026-04-20',
      clients: [{ id: 1, name: 'Acme Ltd', email: 'ops@acme.example' }],
      invoices: [
        { id: 1, clientId: 1, status: 'SENT', issueDate: '2026-02-01', dueDate: '2026-03-31',
          lineItems: [{ id: 1, description: 'Design', qty: 1, unitPrice: 100 }] },
      ],
      payments: [
        { id: 1, clientId: 1, amount: 50, date: '2026-03-10', allocations: [{ invoiceId: 1, amount: 50 }] },
        { id: 2, clientId: 1, amount: 50, date: '2026-03-25', allocations: [{ invoiceId: 1, amount: 50 }] },
      ],
    });
    await page.goto('/');

    await page.getByTestId('client-row-1').click();
    await page.getByTestId('invoice-row-1').click();
    await expect(page.getByTestId('invoice-paid-date')).toHaveText('2026-03-25');
    await page.getByTestId('payment-row-2').getByTestId('payment-reverse').click();
    await expect(page.getByTestId('invoice-paid-date')).toHaveCount(0);
    await expect(page.getByTestId('invoice-amount-due')).toHaveText('$50.00'); // 100.00 - 50.00
    await expect(page.getByTestId('invoice-panel-status')).toHaveText('Overdue'); // due 03-31, today 04-20
  });
});
